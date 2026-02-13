import { create } from "zustand";
import type { ServerStatus } from "@/utils/ipc";

interface BridgeState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  serverStatus: ServerStatus | null;
  lastError: string | null;

  // Connection config (persisted to localStorage)
  host: string;
  port: number;
  authToken: string;
  serverModPath: string;

  // Block palette (fetched once per connection)
  blockPalette: Record<string, string> | null;

  // Dialog visibility
  dialogOpen: boolean;

  // Actions
  setConnected: (connected: boolean, status?: ServerStatus | null) => void;
  setConnecting: (connecting: boolean) => void;
  setLastError: (error: string | null) => void;
  setConnectionConfig: (host: string, port: number, authToken: string) => void;
  setServerModPath: (path: string) => void;
  setBlockPalette: (palette: Record<string, string> | null) => void;
  setDialogOpen: (open: boolean) => void;
}

function getStored(key: string, fallback: string): string {
  return typeof localStorage !== "undefined"
    ? localStorage.getItem(key) ?? fallback
    : fallback;
}

function getStoredNumber(key: string, fallback: number): number {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  if (v === null) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

export const useBridgeStore = create<BridgeState>((set) => ({
  connected: false,
  connecting: false,
  serverStatus: null,
  lastError: null,

  host: getStored("tn-bridge-host", "127.0.0.1"),
  port: getStoredNumber("tn-bridge-port", 7854),
  authToken: getStored("tn-bridge-authToken", ""),
  serverModPath: getStored("tn-bridge-serverModPath", ""),

  blockPalette: null,

  dialogOpen: false,

  setConnected: (connected, status) =>
    set({
      connected,
      connecting: false,
      serverStatus: status ?? (connected ? undefined : null),
    }),

  setConnecting: (connecting) => set({ connecting }),

  setLastError: (lastError) => set({ lastError }),

  setConnectionConfig: (host, port, authToken) => {
    localStorage.setItem("tn-bridge-host", host);
    localStorage.setItem("tn-bridge-port", String(port));
    localStorage.setItem("tn-bridge-authToken", authToken);
    set({ host, port, authToken });
  },

  setServerModPath: (serverModPath) => {
    localStorage.setItem("tn-bridge-serverModPath", serverModPath);
    set({ serverModPath });
  },

  setBlockPalette: (blockPalette) => set({ blockPalette }),

  setDialogOpen: (dialogOpen) => set({ dialogOpen }),
}));
