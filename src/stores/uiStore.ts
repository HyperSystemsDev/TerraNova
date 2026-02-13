import { create } from "zustand";
import { on } from "./storeEvents";

function getStoredBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

function persist(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore write failures
  }
}

export interface Bookmark {
  x: number;
  y: number;
  zoom: number;
  label?: string;
}

// Project-scoped bookmark state
let _currentProjectPath = "";
let _currentFilePath = "default";
let _currentBiomeSection = "";

function bookmarksKey(): string {
  return `tn-bookmarks:${_currentProjectPath}:${_currentFilePath}:${_currentBiomeSection}`;
}

function loadBookmarks(): Map<number, Bookmark> {
  try {
    const stored = localStorage.getItem(bookmarksKey());
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, Bookmark>;
      const map = new Map<number, Bookmark>();
      for (const [key, val] of Object.entries(parsed)) {
        map.set(Number(key), val);
      }
      return map;
    }
  } catch {
    // Ignore
  }
  return new Map();
}

function persistBookmarks(bookmarks: Map<number, Bookmark>) {
  try {
    const obj: Record<string, Bookmark> = {};
    for (const [key, val] of bookmarks) {
      obj[String(key)] = val;
    }
    localStorage.setItem(bookmarksKey(), JSON.stringify(obj));
  } catch {
    // Ignore write failures
  }
}

interface UIState {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showMinimap: boolean;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  helpMode: boolean;

  // Props deletion confirmation preference
  suppressPropDeleteConfirm: boolean;

  // Bookmarks
  bookmarks: Map<number, Bookmark>;

  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleMinimap: () => void;
  setLeftPanelVisible: (visible: boolean) => void;
  setRightPanelVisible: (visible: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleHelpMode: () => void;

  // Props deletion confirmation
  setSuppressPropDeleteConfirm: (value: boolean) => void;

  // Bookmark actions
  setBookmark: (slot: number, bookmark: Bookmark) => void;
  removeBookmark: (slot: number) => void;
  renameBookmark: (slot: number, label: string) => void;
  reloadBookmarks: (filePath?: string, projectPath?: string, biomeSection?: string) => void;
  clearBookmarks: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showGrid: getStoredBool("tn-showGrid", false),
  snapToGrid: getStoredBool("tn-snapToGrid", false),
  gridSize: 20,
  showMinimap: getStoredBool("tn-showMinimap", true),
  leftPanelVisible: getStoredBool("tn-leftPanel", true),
  rightPanelVisible: getStoredBool("tn-rightPanel", true),
  helpMode: false,
  suppressPropDeleteConfirm: getStoredBool("tn-suppressPropDeleteConfirm", false),
  bookmarks: new Map(),

  toggleGrid: () => {
    const next = !get().showGrid;
    persist("tn-showGrid", next);
    set({ showGrid: next });
  },
  toggleSnap: () => {
    const next = !get().snapToGrid;
    persist("tn-snapToGrid", next);
    set({ snapToGrid: next });
  },
  toggleMinimap: () => {
    const next = !get().showMinimap;
    persist("tn-showMinimap", next);
    set({ showMinimap: next });
  },
  setLeftPanelVisible: (visible) => {
    persist("tn-leftPanel", visible);
    set({ leftPanelVisible: visible });
  },
  setRightPanelVisible: (visible) => {
    persist("tn-rightPanel", visible);
    set({ rightPanelVisible: visible });
  },
  toggleLeftPanel: () => {
    const next = !get().leftPanelVisible;
    persist("tn-leftPanel", next);
    set({ leftPanelVisible: next });
  },
  toggleRightPanel: () => {
    const next = !get().rightPanelVisible;
    persist("tn-rightPanel", next);
    set({ rightPanelVisible: next });
  },
  toggleHelpMode: () => set({ helpMode: !get().helpMode }),

  setSuppressPropDeleteConfirm: (value) => {
    persist("tn-suppressPropDeleteConfirm", value);
    set({ suppressPropDeleteConfirm: value });
  },

  setBookmark: (slot, bookmark) => {
    const updated = new Map(get().bookmarks);
    updated.set(slot, bookmark);
    persistBookmarks(updated);
    set({ bookmarks: updated });
  },
  removeBookmark: (slot) => {
    const updated = new Map(get().bookmarks);
    updated.delete(slot);
    persistBookmarks(updated);
    set({ bookmarks: updated });
  },
  renameBookmark: (slot, label) => {
    const bookmarks = get().bookmarks;
    const existing = bookmarks.get(slot);
    if (!existing) return;
    const updated = new Map(bookmarks);
    updated.set(slot, { ...existing, label });
    persistBookmarks(updated);
    set({ bookmarks: updated });
  },
  reloadBookmarks: (filePath?: string, projectPath?: string, biomeSection?: string) => {
    if (projectPath !== undefined) _currentProjectPath = projectPath;
    _currentFilePath = filePath ?? "default";
    if (biomeSection !== undefined) _currentBiomeSection = biomeSection;
    set({ bookmarks: loadBookmarks() });
  },
  clearBookmarks: () => {
    _currentProjectPath = "";
    _currentFilePath = "default";
    _currentBiomeSection = "";
    set({ bookmarks: new Map() });
  },
}));

// Subscribe to project:close to clear bookmarks
on("project:close", () => {
  useUIStore.getState().clearBookmarks();
});
