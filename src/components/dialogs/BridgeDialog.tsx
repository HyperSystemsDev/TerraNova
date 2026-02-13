import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useBridgeStore } from "@/stores/bridgeStore";
import { useBridge } from "@/hooks/useBridge";

export function BridgeDialog() {
  const isOpen = useBridgeStore((s) => s.dialogOpen);
  const connected = useBridgeStore((s) => s.connected);
  const connecting = useBridgeStore((s) => s.connecting);
  const serverStatus = useBridgeStore((s) => s.serverStatus);
  const lastError = useBridgeStore((s) => s.lastError);
  const storeHost = useBridgeStore((s) => s.host);
  const storePort = useBridgeStore((s) => s.port);
  const storeAuthToken = useBridgeStore((s) => s.authToken);
  const storeServerModPath = useBridgeStore((s) => s.serverModPath);
  const setDialogOpen = useBridgeStore((s) => s.setDialogOpen);

  const [host, setHost] = useState(storeHost);
  const [port, setPort] = useState(String(storePort));
  const [authToken, setAuthToken] = useState(storeAuthToken);
  const [serverModPath, setServerModPath] = useState(storeServerModPath);
  const [showToken, setShowToken] = useState(false);

  // Regen chunks fields
  const [regenX, setRegenX] = useState("0");
  const [regenZ, setRegenZ] = useState("0");
  const [regenRadius, setRegenRadius] = useState("3");

  // Teleport fields
  const [tpPlayer, setTpPlayer] = useState("");
  const [tpX, setTpX] = useState("0");
  const [tpY, setTpY] = useState("64");
  const [tpZ, setTpZ] = useState("0");

  // Player info
  const [playerInfo, setPlayerInfo] = useState<{
    name: string;
    x?: number;
    y?: number;
    z?: number;
    world?: string;
  } | null>(null);

  const {
    connect,
    disconnect,
    reloadWorldgen,
    regenerateChunks,
    teleport,
    getPlayerInfo,
    syncAndReload,
  } = useBridge();

  // Sync local state with store when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHost(useBridgeStore.getState().host);
      setPort(String(useBridgeStore.getState().port));
      setAuthToken(useBridgeStore.getState().authToken);
      setServerModPath(useBridgeStore.getState().serverModPath);
      setPlayerInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function onClose() {
    setDialogOpen(false);
  }

  async function handleConnect() {
    // Save config to store before connecting
    const portNum = parseInt(port, 10) || 7854;
    useBridgeStore.getState().setConnectionConfig(host, portNum, authToken);
    if (serverModPath) {
      useBridgeStore.getState().setServerModPath(serverModPath);
    }
    await connect();
  }

  async function handleDisconnect() {
    await disconnect();
    setPlayerInfo(null);
  }

  async function handleReloadWorldgen() {
    await reloadWorldgen();
  }

  async function handleRegenChunks() {
    await regenerateChunks(
      parseInt(regenX, 10) || 0,
      parseInt(regenZ, 10) || 0,
      parseInt(regenRadius, 10) || 3,
    );
  }

  async function handleTeleport() {
    if (!tpPlayer.trim()) return;
    await teleport(
      tpPlayer.trim(),
      parseFloat(tpX) || 0,
      parseFloat(tpY) || 64,
      parseFloat(tpZ) || 0,
    );
  }

  async function handleGetPlayerInfo() {
    const info = await getPlayerInfo();
    if (info) setPlayerInfo(info);
  }

  async function handleSyncAndReload() {
    if (serverModPath) {
      useBridgeStore.getState().setServerModPath(serverModPath);
    }
    await syncAndReload();
  }

  async function handleBrowseModPath() {
    const selected = await open({ directory: true, title: "Select server mod data folder" });
    if (selected) {
      const path = typeof selected === "string" ? selected : selected;
      setServerModPath(path);
      useBridgeStore.getState().setServerModPath(path);
    }
  }

  const statusColor = connected
    ? "text-emerald-400"
    : connecting
      ? "text-amber-400"
      : "text-tn-text-muted";

  const statusText = connected
    ? "Connected"
    : connecting
      ? "Connecting..."
      : "Disconnected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-tn-panel border border-tn-border rounded-lg shadow-xl w-[480px] max-h-[85vh] overflow-y-auto p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Bridge Connection</h2>
          <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
        </div>

        {/* Connection Config */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-tn-text-muted">Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="127.0.0.1"
                disabled={connected || connecting}
                className="px-2 py-1.5 text-sm bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-xs text-tn-text-muted">Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="7854"
                disabled={connected || connecting}
                className="px-2 py-1.5 text-sm bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-tn-text-muted">Auth Token</label>
            <div className="flex gap-2">
              <input
                type={showToken ? "text" : "password"}
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Enter auth token..."
                disabled={connected || connecting}
                className="flex-1 px-2 py-1.5 text-sm bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none disabled:opacity-50"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="px-2 py-1.5 text-xs bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-tn-text-muted">Server Mod Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverModPath}
                onChange={(e) => setServerModPath(e.target.value)}
                placeholder="Path to server's mod data folder..."
                className="flex-1 px-2 py-1.5 text-sm bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none text-tn-text-muted"
              />
              <button
                onClick={handleBrowseModPath}
                className="px-3 py-1.5 text-sm bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Connect / Disconnect button */}
          <div className="flex gap-2">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-1.5 text-sm rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-1.5 text-sm rounded bg-tn-accent text-tn-bg font-medium disabled:opacity-50 hover:opacity-90"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* Error display */}
        {lastError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
            {lastError}
          </p>
        )}

        {/* Actions section (only when connected) */}
        {connected && (
          <>
            <div className="border-t border-tn-border pt-3">
              <h3 className="text-sm font-medium mb-2">Server Info</h3>
              {serverStatus && (
                <div className="text-xs text-tn-text-muted grid grid-cols-2 gap-1">
                  <span>Status: <span className="text-emerald-400">{serverStatus.status}</span></span>
                  <span>Bridge: v{serverStatus.bridge_version}</span>
                  <span>Players: {serverStatus.player_count}</span>
                  <span>Port: {serverStatus.port}</span>
                </div>
              )}
            </div>

            <div className="border-t border-tn-border pt-3 flex flex-col gap-3">
              <h3 className="text-sm font-medium">Actions</h3>

              {/* Reload Worldgen */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReloadWorldgen}
                  className="px-3 py-1.5 text-sm bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
                >
                  Reload Worldgen
                </button>
                <span className="text-xs text-tn-text-muted">Triggers server worldgen reload</span>
              </div>

              {/* Sync & Reload */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncAndReload}
                  className="px-3 py-1.5 text-sm bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
                >
                  Sync & Reload
                </button>
                <span className="text-xs text-tn-text-muted">Copy current file to server + reload</span>
              </div>

              {/* Regenerate Chunks */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-tn-text-muted">Regenerate Chunks</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={regenX}
                    onChange={(e) => setRegenX(e.target.value)}
                    placeholder="X"
                    className="w-16 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <input
                    type="text"
                    value={regenZ}
                    onChange={(e) => setRegenZ(e.target.value)}
                    placeholder="Z"
                    className="w-16 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <input
                    type="text"
                    value={regenRadius}
                    onChange={(e) => setRegenRadius(e.target.value)}
                    placeholder="R"
                    className="w-16 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <button
                    onClick={handleRegenChunks}
                    className="px-3 py-1 text-xs bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
                  >
                    Regen
                  </button>
                </div>
              </div>

              {/* Teleport */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-tn-text-muted">Teleport Player</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tpPlayer}
                    onChange={(e) => setTpPlayer(e.target.value)}
                    placeholder="Player"
                    className="w-24 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <input
                    type="text"
                    value={tpX}
                    onChange={(e) => setTpX(e.target.value)}
                    placeholder="X"
                    className="w-14 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <input
                    type="text"
                    value={tpY}
                    onChange={(e) => setTpY(e.target.value)}
                    placeholder="Y"
                    className="w-14 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <input
                    type="text"
                    value={tpZ}
                    onChange={(e) => setTpZ(e.target.value)}
                    placeholder="Z"
                    className="w-14 px-2 py-1 text-xs bg-tn-bg border border-tn-border rounded focus:border-tn-accent outline-none"
                  />
                  <button
                    onClick={handleTeleport}
                    disabled={!tpPlayer.trim()}
                    className="px-3 py-1 text-xs bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20 disabled:opacity-50"
                  >
                    TP
                  </button>
                </div>
              </div>

              {/* Player Info */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGetPlayerInfo}
                    className="px-3 py-1.5 text-sm bg-tn-surface border border-tn-border rounded hover:bg-tn-accent/20"
                  >
                    Get Player Info
                  </button>
                </div>
                {playerInfo && (
                  <div className="text-xs text-tn-text-muted mt-1 bg-tn-bg rounded px-2 py-1.5 border border-tn-border">
                    <span className="text-tn-text">{playerInfo.name}</span>
                    {playerInfo.x != null && (
                      <span className="ml-2">
                        ({playerInfo.x.toFixed(1)}, {playerInfo.y?.toFixed(1)}, {playerInfo.z?.toFixed(1)})
                      </span>
                    )}
                    {playerInfo.world && <span className="ml-2">[{playerInfo.world}]</span>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t border-tn-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded border border-tn-border hover:bg-tn-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
