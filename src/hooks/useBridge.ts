import { useCallback } from "react";
import { useBridgeStore } from "@/stores/bridgeStore";
import { useProjectStore } from "@/stores/projectStore";
import {
  bridgeConnect,
  bridgeDisconnect,
  bridgeStatus,
  bridgeReloadWorldgen,
  bridgeRegenerateChunks,
  bridgeTeleport,
  bridgePlayerInfo,
  bridgeSyncFile,
} from "@/utils/ipc";
import type { ServerStatus, BridgeResponse, PlayerInfo } from "@/utils/ipc";

export function useBridge() {
  const connect = useCallback(async (): Promise<ServerStatus> => {
    const { host, port, authToken, setConnecting, setConnected, setLastError, setConnectionConfig } =
      useBridgeStore.getState();
    setLastError(null);
    setConnecting(true);
    try {
      // Persist current config on connect attempt
      setConnectionConfig(host, port, authToken);
      const status = await bridgeConnect(host, port, authToken);
      setConnected(true, status);
      return status;
    } catch (err) {
      setConnected(false, null);
      setLastError(`Connection failed: ${err}`);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    const { setConnected, setLastError } = useBridgeStore.getState();
    setLastError(null);
    try {
      await bridgeDisconnect();
      setConnected(false, null);
    } catch (err) {
      setLastError(`Disconnect failed: ${err}`);
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<ServerStatus | null> => {
    const { setConnected, setLastError } = useBridgeStore.getState();
    setLastError(null);
    try {
      const status = await bridgeStatus();
      setConnected(true, status);
      return status;
    } catch (err) {
      setLastError(`Status check failed: ${err}`);
      return null;
    }
  }, []);

  const reloadWorldgen = useCallback(async (): Promise<BridgeResponse | null> => {
    const { setLastError } = useBridgeStore.getState();
    setLastError(null);
    try {
      const res = await bridgeReloadWorldgen();
      if (!res.success) setLastError(res.message);
      return res;
    } catch (err) {
      setLastError(`Reload failed: ${err}`);
      return null;
    }
  }, []);

  const regenerateChunks = useCallback(
    async (x: number, z: number, radius: number): Promise<BridgeResponse | null> => {
      const { setLastError } = useBridgeStore.getState();
      setLastError(null);
      try {
        const res = await bridgeRegenerateChunks(x, z, radius);
        if (!res.success) setLastError(res.message);
        return res;
      } catch (err) {
        setLastError(`Regen failed: ${err}`);
        return null;
      }
    },
    [],
  );

  const teleport = useCallback(
    async (playerName: string, x: number, y: number, z: number): Promise<BridgeResponse | null> => {
      const { setLastError } = useBridgeStore.getState();
      setLastError(null);
      try {
        const res = await bridgeTeleport(playerName, x, y, z);
        if (!res.success) setLastError(res.message);
        return res;
      } catch (err) {
        setLastError(`Teleport failed: ${err}`);
        return null;
      }
    },
    [],
  );

  const getPlayerInfo = useCallback(async (): Promise<PlayerInfo | null> => {
    const { setLastError } = useBridgeStore.getState();
    setLastError(null);
    try {
      return await bridgePlayerInfo();
    } catch (err) {
      setLastError(`Player info failed: ${err}`);
      return null;
    }
  }, []);

  const syncAndReload = useCallback(async (): Promise<BridgeResponse | null> => {
    const { serverModPath, setLastError } = useBridgeStore.getState();
    const { currentFile, projectPath } = useProjectStore.getState();
    setLastError(null);

    if (!currentFile || !projectPath || !serverModPath) {
      setLastError("No file open, no project path, or no server mod path configured");
      return null;
    }

    // Compute the relative path from projectPath to currentFile
    const relativePath = currentFile.startsWith(projectPath)
      ? currentFile.slice(projectPath.length).replace(/^[/\\]/, "")
      : currentFile;

    try {
      const res = await bridgeSyncFile(currentFile, serverModPath, relativePath);
      if (!res.success) setLastError(res.message);
      return res;
    } catch (err) {
      setLastError(`Sync failed: ${err}`);
      return null;
    }
  }, []);

  return {
    connect,
    disconnect,
    refreshStatus,
    reloadWorldgen,
    regenerateChunks,
    teleport,
    getPlayerInfo,
    syncAndReload,
  };
}
