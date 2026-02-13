import { create } from "zustand";
import type { LanguageId } from "@/languages/types";
import { DEFAULT_FLOW_DIRECTION, type FlowDirection } from "@/constants";

const STORAGE_KEY = "tn-settings";

function getStoredLanguage(): LanguageId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "hytale";
    const parsed = JSON.parse(raw);
    if (parsed.language === "terranova" || parsed.language === "hytale") {
      return parsed.language;
    }
  } catch {
    // ignore
  }
  return "hytale";
}

function getStoredFlowDirection(): FlowDirection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FLOW_DIRECTION;
    const parsed = JSON.parse(raw);
    if (parsed.flowDirection === "LR" || parsed.flowDirection === "RL") {
      return parsed.flowDirection;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FLOW_DIRECTION;
}

function getStoredAutoLayoutOnOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (typeof parsed.autoLayoutOnOpen === "boolean") {
      return parsed.autoLayoutOnOpen;
    }
  } catch {
    // ignore
  }
  return true;
}

function getStoredExportPath(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.exportPath === "string") return parsed.exportPath;
  } catch {
    // ignore
  }
  return null;
}

function getStoredKeybindingOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.keybindingOverrides && typeof parsed.keybindingOverrides === "object") {
      return parsed.keybindingOverrides;
    }
  } catch {
    // ignore
  }
  return {};
}

function persistSettings(settings: {
  language: LanguageId;
  flowDirection: FlowDirection;
  autoLayoutOnOpen: boolean;
  keybindingOverrides: Record<string, string>;
  exportPath: string | null;
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface SettingsState {
  language: LanguageId;
  flowDirection: FlowDirection;
  autoLayoutOnOpen: boolean;
  keybindingOverrides: Record<string, string>;
  exportPath: string | null;
  setLanguage: (lang: LanguageId) => void;
  setFlowDirection: (dir: FlowDirection) => void;
  setAutoLayoutOnOpen: (value: boolean) => void;
  setKeybindingOverride: (id: string, key: string) => void;
  resetKeybinding: (id: string) => void;
  resetAllKeybindings: () => void;
  setExportPath: (path: string | null) => void;
}

function getAllSettings(state: SettingsState) {
  return {
    language: state.language,
    flowDirection: state.flowDirection,
    autoLayoutOnOpen: state.autoLayoutOnOpen,
    keybindingOverrides: state.keybindingOverrides,
    exportPath: state.exportPath,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: getStoredLanguage(),
  flowDirection: getStoredFlowDirection(),
  autoLayoutOnOpen: getStoredAutoLayoutOnOpen(),
  keybindingOverrides: getStoredKeybindingOverrides(),
  exportPath: getStoredExportPath(),

  setLanguage: (lang) => {
    set({ language: lang });
    persistSettings(getAllSettings({ ...get(), language: lang }));
  },

  setFlowDirection: (dir) => {
    set({ flowDirection: dir });
    persistSettings(getAllSettings({ ...get(), flowDirection: dir }));
  },

  setAutoLayoutOnOpen: (value) => {
    set({ autoLayoutOnOpen: value });
    persistSettings(getAllSettings({ ...get(), autoLayoutOnOpen: value }));
  },

  setKeybindingOverride: (id, key) => {
    const overrides = { ...get().keybindingOverrides, [id]: key };
    set({ keybindingOverrides: overrides });
    persistSettings(getAllSettings({ ...get(), keybindingOverrides: overrides }));
  },

  resetKeybinding: (id) => {
    const overrides = { ...get().keybindingOverrides };
    delete overrides[id];
    set({ keybindingOverrides: overrides });
    persistSettings(getAllSettings({ ...get(), keybindingOverrides: overrides }));
  },

  resetAllKeybindings: () => {
    set({ keybindingOverrides: {} });
    persistSettings(getAllSettings({ ...get(), keybindingOverrides: {} }));
  },

  setExportPath: (path) => {
    set({ exportPath: path });
    persistSettings(getAllSettings({ ...get(), exportPath: path }));
  },
}));
