import { useEffect, useRef } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useBridgeStore } from "@/stores/bridgeStore";
import {
  bridgeFetchPalette,
  bridgeFetchChunk,
  bridgePlayerInfo,
  type ChunkDataResponse,
} from "@/utils/ipc";
import { buildWorldMeshes } from "@/utils/worldMeshBuilder";

const FOLLOW_POLL_MS = 5000; // Poll player position every 5s
const CHUNK_FETCH_TIMEOUT_MS = 10_000; // Per-chunk fetch timeout (normal)
const CHUNK_FORCE_LOAD_TIMEOUT_MS = 25_000; // Per-chunk fetch timeout (force-load)

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Chunk fetch timed out")), ms),
    ),
  ]);
}

/**
 * World preview hook — fetches real chunk data from TerraNovaBridge
 * and builds meshes for the VoxelPreview3D renderer.
 */
export function useWorldPreview() {
  const mode = usePreviewStore((s) => s.mode);
  const viewMode = usePreviewStore((s) => s.viewMode);
  const worldCenterX = usePreviewStore((s) => s.worldCenterX);
  const worldCenterZ = usePreviewStore((s) => s.worldCenterZ);
  const worldRadius = usePreviewStore((s) => s.worldRadius);
  const worldYMin = usePreviewStore((s) => s.worldYMin);
  const worldYMax = usePreviewStore((s) => s.worldYMax);
  const worldFollowPlayer = usePreviewStore((s) => s.worldFollowPlayer);
  const worldSurfaceDepth = usePreviewStore((s) => s.worldSurfaceDepth);
  const worldLavaLevel = usePreviewStore((s) => s.worldLavaLevel);
  const worldForceLoad = usePreviewStore((s) => s.worldForceLoad);

  const connected = useBridgeStore((s) => s.connected);
  const blockPalette = useBridgeStore((s) => s.blockPalette);

  const evalIdRef = useRef(0);
  const followTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Scene transform from last mesh build — used for instant lava repositioning
  const sceneTransformRef = useRef<{ yMin: number; scale: number; terrainSize: number } | null>(null);
  // Cache key for the last successful fetch — skip re-fetch when returning to World mode
  const lastFetchKeyRef = useRef<string | null>(null);

  // Fetch palette once when bridge connects
  useEffect(() => {
    if (!connected) {
      useBridgeStore.getState().setBlockPalette(null);
      lastFetchKeyRef.current = null; // invalidate cache on disconnect
      return;
    }

    bridgeFetchPalette()
      .then((res) => {
        useBridgeStore.getState().setBlockPalette(res.palette);
        // Clear any previous palette error
        if (usePreviewStore.getState().mode === "world") {
          usePreviewStore.getState().setWorldError(null);
        }
      })
      .catch((err) => {
        usePreviewStore.getState().setWorldError(
          `Failed to fetch block palette — is TerraNovaBridge v0.2.0+ deployed? (${err})`,
        );
      });
  }, [connected]);

  // Follow player position
  useEffect(() => {
    if (!connected || !worldFollowPlayer || mode !== "world") {
      if (followTimerRef.current) {
        clearInterval(followTimerRef.current);
        followTimerRef.current = null;
      }
      return;
    }

    async function pollPlayer() {
      try {
        const info = await bridgePlayerInfo();
        if (info.x != null && info.z != null) {
          const cx = Math.floor(info.x / 32);
          const cz = Math.floor(info.z / 32);
          const store = usePreviewStore.getState();
          if (store.worldCenterX !== cx || store.worldCenterZ !== cz) {
            store.setWorldCenterX(cx);
            store.setWorldCenterZ(cz);
          }
        }
      } catch {
        // Player not available — ignore
      }
    }

    pollPlayer(); // immediate first poll
    followTimerRef.current = setInterval(pollPlayer, FOLLOW_POLL_MS);

    return () => {
      if (followTimerRef.current) {
        clearInterval(followTimerRef.current);
        followTimerRef.current = null;
      }
    };
  }, [connected, worldFollowPlayer, mode]);

  // Auto-center on player when entering World mode
  useEffect(() => {
    if (mode !== "world" || !connected) return;

    let cancelled = false;

    bridgePlayerInfo()
      .then((info) => {
        if (cancelled) return;
        if (info.x != null && info.z != null) {
          const cx = Math.floor(info.x / 32);
          const cz = Math.floor(info.z / 32);
          const store = usePreviewStore.getState();
          // Only update if still at default (0, 0) or first entry
          if (store.worldCenterX === 0 && store.worldCenterZ === 0) {
            store.setWorldCenterX(cx);
            store.setWorldCenterZ(cz);
          }
        }
      })
      .catch(() => {
        // Player info not available — keep current center
      });

    return () => {
      cancelled = true;
    };
  }, [mode, connected]);

  // Main chunk loading effect — debounced to prevent flooding on rapid param changes
  useEffect(() => {
    if (mode !== "world" || viewMode === "graph" || !connected) return;

    if (!blockPalette) {
      usePreviewStore.getState().setWorldLoading(true);
      return;
    }

    const radius = Math.max(0, Math.min(worldRadius, 5));
    const side = 2 * radius + 1;
    const totalChunks = side * side;

    // Cache key — skip re-fetch if params haven't changed (e.g. switching tabs and back)
    // Include palette size to invalidate when reconnecting to a different world
    const paletteKey = blockPalette ? Object.keys(blockPalette).length : 0;
    const fetchKey = `${worldCenterX},${worldCenterZ},${radius},${worldYMin},${worldYMax},${worldSurfaceDepth},${paletteKey},${worldForceLoad}`;
    if (fetchKey === lastFetchKeyRef.current && usePreviewStore.getState().voxelMeshData) {
      usePreviewStore.getState().setWorldLoading(false);
      return;
    }

    let cancelled = false;

    // Debounce: wait 300ms before starting fetches to absorb rapid parameter changes
    const debounceTimer = setTimeout(() => {
      if (cancelled) return;
      startChunkLoading();
    }, 300);

    function startChunkLoading() {
    const evalId = ++evalIdRef.current;
    const store = usePreviewStore.getState();

    store.setWorldLoading(true);
    store.setWorldError(null);
    store.setWorldProgress(0, totalChunks);

    async function loadChunks() {
      // Build list of chunk coordinates to fetch
      const coords: { cx: number; cz: number }[] = [];
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          coords.push({ cx: worldCenterX + dx, cz: worldCenterZ + dz });
        }
      }

      // Reduce batch size when force-loading to match server's thread pool
      const BATCH_SIZE = worldForceLoad ? 4 : 8;
      const timeoutMs = worldForceLoad ? CHUNK_FORCE_LOAD_TIMEOUT_MS : CHUNK_FETCH_TIMEOUT_MS;
      const loadedChunks: ChunkDataResponse[] = [];
      const chunkErrors: string[] = [];
      let loaded = 0;

      for (let i = 0; i < coords.length; i += BATCH_SIZE) {
        if (cancelled || evalId !== evalIdRef.current) return;

        const batch = coords.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(({ cx, cz }) =>
            withTimeout(
              bridgeFetchChunk(cx, cz, worldYMin, worldYMax, worldForceLoad),
              timeoutMs,
            ),
          ),
        );

        for (const r of results) {
          if (r.status === "fulfilled") {
            loadedChunks.push(r.value);
          } else if (chunkErrors.length < 3) {
            const reason = String(r.reason);
            if (!chunkErrors.includes(reason)) chunkErrors.push(reason);
          }
          loaded++;
        }

        if (evalId === evalIdRef.current && !cancelled) {
          usePreviewStore.getState().setWorldProgress(loaded, totalChunks);
        }

        // Fail-fast: if every chunk in the first batch failed, abort early
        // instead of waiting for all remaining chunks to time out too
        if (i === 0 && loadedChunks.length === 0 && chunkErrors.length > 0) {
          break;
        }
      }

      if (cancelled || evalId !== evalIdRef.current) return;

      if (loadedChunks.length > 0) {
        // Yield two frames so React can paint "all chunks loaded" before heavy mesh build
        usePreviewStore.getState().setWorldProgress(totalChunks, totalChunks);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (evalId !== evalIdRef.current) return;

        const { meshes, sceneYMin, sceneScale, terrainSize } = buildWorldMeshes(
          loadedChunks,
          blockPalette!,
          worldCenterX,
          worldCenterZ,
          worldSurfaceDepth,
        );
        if (cancelled || evalId !== evalIdRef.current) return;
        sceneTransformRef.current = { yMin: sceneYMin, scale: sceneScale, terrainSize };
        usePreviewStore.getState().setVoxelMeshData(meshes);

        // Set lava config immediately after mesh build to avoid timing race
        const ps = usePreviewStore.getState();
        const currentLavaLevel = ps.worldLavaLevel;
        if (currentLavaLevel > 0) {
          const sceneY = (currentLavaLevel - sceneYMin) * sceneScale - 25;
          ps.setFluidPlaneConfig({ type: "lava", yPosition: sceneY, size: terrainSize });
          ps.setShowWaterPlane(true);
        } else {
          ps.setFluidPlaneConfig(null);
          ps.setShowWaterPlane(false);
        }

        // Mark this fetch as cached
        lastFetchKeyRef.current = fetchKey;
      } else {
        const hint = worldForceLoad
          ? "Even with Generate Chunks enabled, no data was returned."
          : "Enable \"Generate Chunks\" to load terrain without a nearby player.";
        const errorDetail = chunkErrors.length > 0
          ? `\n\nServer: ${chunkErrors[0]}`
          : "";
        usePreviewStore.getState().setWorldError(
          `No loaded chunks found — tried ${totalChunks} chunks around (${worldCenterX}, ${worldCenterZ}). ${hint}${errorDetail}`,
        );
        usePreviewStore.getState().setVoxelMeshData(null);
        lastFetchKeyRef.current = null;
      }

      usePreviewStore.getState().setWorldLoading(false);
    }

    loadChunks().catch((err) => {
      if (evalId === evalIdRef.current) {
        usePreviewStore.getState().setWorldError(`World loading failed: ${err}`);
        usePreviewStore.getState().setWorldLoading(false);
      }
    });
    } // end startChunkLoading

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [mode, viewMode, connected, blockPalette, worldCenterX, worldCenterZ, worldRadius, worldYMin, worldYMax, worldSurfaceDepth, worldForceLoad]);

  // Instant lava plane repositioning — no re-fetch, no re-mesh
  useEffect(() => {
    const t = sceneTransformRef.current;
    if (mode !== "world" || !t) return;

    if (worldLavaLevel > 0) {
      const sceneY = (worldLavaLevel - t.yMin) * t.scale - 25; // 25 = sceneSize/2
      usePreviewStore.getState().setFluidPlaneConfig({
        type: "lava",
        yPosition: sceneY,
        size: t.terrainSize,
      });
      usePreviewStore.getState().setShowWaterPlane(true);
    } else {
      usePreviewStore.getState().setFluidPlaneConfig(null);
      usePreviewStore.getState().setShowWaterPlane(false);
    }
  }, [mode, worldLavaLevel]);
}
