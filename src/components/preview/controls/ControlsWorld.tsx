import { useState, useEffect } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useBridgeStore } from "@/stores/bridgeStore";
import { SliderField } from "@/components/properties/SliderField";

export function ControlsWorld() {
  const worldCenterX = usePreviewStore((s) => s.worldCenterX);
  const setWorldCenterX = usePreviewStore((s) => s.setWorldCenterX);
  const worldCenterZ = usePreviewStore((s) => s.worldCenterZ);
  const setWorldCenterZ = usePreviewStore((s) => s.setWorldCenterZ);
  const worldRadius = usePreviewStore((s) => s.worldRadius);
  const setWorldRadius = usePreviewStore((s) => s.setWorldRadius);
  const worldYMin = usePreviewStore((s) => s.worldYMin);
  const setWorldYMin = usePreviewStore((s) => s.setWorldYMin);
  const worldYMax = usePreviewStore((s) => s.worldYMax);
  const setWorldYMax = usePreviewStore((s) => s.setWorldYMax);
  const isWorldLoading = usePreviewStore((s) => s.isWorldLoading);
  const worldChunkCount = usePreviewStore((s) => s.worldChunkCount);
  const worldTotalChunks = usePreviewStore((s) => s.worldTotalChunks);
  const worldFollowPlayer = usePreviewStore((s) => s.worldFollowPlayer);
  const setWorldFollowPlayer = usePreviewStore((s) => s.setWorldFollowPlayer);
  const worldForceLoad = usePreviewStore((s) => s.worldForceLoad);
  const setWorldForceLoad = usePreviewStore((s) => s.setWorldForceLoad);
  const worldSurfaceDepth = usePreviewStore((s) => s.worldSurfaceDepth);
  const setWorldSurfaceDepth = usePreviewStore((s) => s.setWorldSurfaceDepth);
  const worldLavaLevel = usePreviewStore((s) => s.worldLavaLevel);
  const setWorldLavaLevel = usePreviewStore((s) => s.setWorldLavaLevel);
  const showVoxelWireframe = usePreviewStore((s) => s.showVoxelWireframe);
  const setShowVoxelWireframe = usePreviewStore((s) => s.setShowVoxelWireframe);
  const showFog3D = usePreviewStore((s) => s.showFog3D);
  const setShowFog3D = usePreviewStore((s) => s.setShowFog3D);
  const showSky3D = usePreviewStore((s) => s.showSky3D);
  const setShowSky3D = usePreviewStore((s) => s.setShowSky3D);
  const showSSAO = usePreviewStore((s) => s.showSSAO);
  const setShowSSAO = usePreviewStore((s) => s.setShowSSAO);
  const showEdgeOutline = usePreviewStore((s) => s.showEdgeOutline);
  const setShowEdgeOutline = usePreviewStore((s) => s.setShowEdgeOutline);

  const bridgeConnected = useBridgeStore((s) => s.connected);

  // Local state for Center X/Z — commit to store on blur/Enter
  const [localCenterX, setLocalCenterX] = useState(String(worldCenterX));
  const [localCenterZ, setLocalCenterZ] = useState(String(worldCenterZ));

  useEffect(() => { setLocalCenterX(String(worldCenterX)); }, [worldCenterX]);
  useEffect(() => { setLocalCenterZ(String(worldCenterZ)); }, [worldCenterZ]);

  function commitCenterX() {
    const v = parseInt(localCenterX, 10);
    if (!isNaN(v) && v !== worldCenterX) {
      setWorldFollowPlayer(false);
      setWorldCenterX(v);
    } else {
      setLocalCenterX(String(worldCenterX));
    }
  }
  function commitCenterZ() {
    const v = parseInt(localCenterZ, 10);
    if (!isNaN(v) && v !== worldCenterZ) {
      setWorldFollowPlayer(false);
      setWorldCenterZ(v);
    } else {
      setLocalCenterZ(String(worldCenterZ));
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-tn-border pt-2">
      <span className="text-[10px] text-tn-text-muted font-medium">World Options</span>

      {!bridgeConnected && (
        <p className="text-[10px] text-yellow-400">Connect to bridge to load world data</p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-[10px] text-tn-text-muted">Center X</label>
          <input
            type="number"
            value={localCenterX}
            onChange={(e) => setLocalCenterX(e.target.value)}
            onBlur={commitCenterX}
            onKeyDown={(e) => e.key === "Enter" && commitCenterX()}
            className="bg-tn-panel border border-tn-border rounded px-1.5 py-0.5 text-[11px] text-tn-text w-full"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-[10px] text-tn-text-muted">Center Z</label>
          <input
            type="number"
            value={localCenterZ}
            onChange={(e) => setLocalCenterZ(e.target.value)}
            onBlur={commitCenterZ}
            onKeyDown={(e) => e.key === "Enter" && commitCenterZ()}
            className="bg-tn-panel border border-tn-border rounded px-1.5 py-0.5 text-[11px] text-tn-text w-full"
          />
        </div>
      </div>

      <SliderField label="Chunk Radius" value={worldRadius} min={1} max={5} step={1} onChange={setWorldRadius} />
      <SliderField label="Y Min" value={worldYMin} min={0} max={319} step={1} onChange={setWorldYMin} />
      <SliderField label="Y Max" value={worldYMax} min={1} max={320} step={1} onChange={setWorldYMax} />
      <SliderField label="Surface Depth" value={worldSurfaceDepth} min={4} max={40} step={4} onChange={setWorldSurfaceDepth} />
      <SliderField label="Lava Level" value={worldLavaLevel} min={0} max={200} step={1} onChange={setWorldLavaLevel} />

      <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
        <input type="checkbox" checked={worldFollowPlayer} onChange={(e) => setWorldFollowPlayer(e.target.checked)} className="accent-tn-accent w-3 h-3" />
        Follow Player
      </label>

      <div title="When enabled, the server will generate chunks that aren't loaded in memory. Slower but works without a nearby player.">
        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={worldForceLoad} onChange={(e) => setWorldForceLoad(e.target.checked)} className="accent-amber-400 w-3 h-3" />
          Generate Chunks
        </label>
        {worldForceLoad && (
          <p className="text-[10px] text-amber-400/80 ml-[18px] mt-0.5">Server will generate unloaded terrain</p>
        )}
      </div>

      {isWorldLoading && (
        <div className="flex items-center gap-1.5 text-[11px] text-tn-text-muted">
          <span className="inline-block w-3 h-3 border-2 border-tn-accent border-t-transparent rounded-full animate-spin" />
          Loading {worldChunkCount}/{worldTotalChunks} chunks
        </div>
      )}

      <div className="border-t border-tn-border pt-2 flex flex-col gap-2">
        <span className="text-[10px] text-tn-text-muted font-medium">Render Options</span>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showVoxelWireframe} onChange={(e) => setShowVoxelWireframe(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Wireframe
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showFog3D} onChange={(e) => setShowFog3D(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Fog
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showSky3D} onChange={(e) => setShowSky3D(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Sky
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showSSAO} onChange={(e) => setShowSSAO(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          SSAO
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showEdgeOutline} onChange={(e) => setShowEdgeOutline(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Edge Outline
        </label>
      </div>
    </div>
  );
}
