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

function persistJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getStoredNumber(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return clampNumber(parsed, min, max);
  } catch {
    return fallback;
  }
}

function getStoredJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Accordion sidebar types & defaults
// ---------------------------------------------------------------------------

export type SidebarSectionId = "nodes" | "files" | "history" | "validation" | "bookmarks";

export type FloatingPanelId =
  | "shared-controls"
  | "materials-legend"
  | "viewmode-overlay"
  | "preview-panel"
  | "comparison-view"
  | "editor-controls"
  | "preview-controls"
  | "editor-canvas";

export const DEFAULT_DOCK_ZONE_BY_COMPONENT: Record<string, string> = {
  toolbar: "toolbar-zone",
  "left-sidebar": "left-dock",
  "shared-controls": "toolbar-zone",
  "materials-legend": "main-dock",
  "viewmode-overlay": "toolbar-zone",
  "preview-panel": "main-dock",
  "comparison-view": "main-dock",
  "preview-controls": "preview-controls-dock",
  "editor-controls": "right-dock",
  "editor-canvas": "main-dock",
};

export const MIN_SNAP_EDGE_THRESHOLD = 16;
export const MAX_SNAP_EDGE_THRESHOLD = 400;

const DEFAULT_SECTION_ORDER: SidebarSectionId[] = ["nodes", "files", "history", "validation", "bookmarks"];

const DEFAULT_SECTION_EXPANDED: Record<SidebarSectionId, boolean> = {
  nodes: true,
  files: false,
  history: false,
  validation: false,
  bookmarks: false,
};

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
  setGridSize: (v: number) => void;
  showMinimap: boolean;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  helpMode: boolean;

  // UI settings dialog
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;

  // Preview HUD visibility
  previewHudVisible: boolean;
  setPreviewHudVisible: (v: boolean) => void;

  // Snap-back behavior for floating panels
  snapBackEnabled: boolean;
  setSnapBackEnabled: (v: boolean) => void;
  snapEdgeThreshold: number;
  setSnapEdgeThreshold: (v: number) => void;

  // Floating panels
  floatingSharedControls: boolean;
  setFloatingSharedControls: (v: boolean) => void;
  // Full preview controls (detachable)
  floatingPreviewControls: boolean;
  setFloatingPreviewControls: (v: boolean) => void;
  floatingMaterialsLegend: boolean;
  setFloatingMaterialsLegend: (v: boolean) => void;
  floatingViewModeOverlay: boolean;
  setFloatingViewModeOverlay: (v: boolean) => void;
  floatingPreviewPanel: boolean;
  setFloatingPreviewPanel: (v: boolean) => void;
  floatingComparisonView: boolean;
  setFloatingComparisonView: (v: boolean) => void;
  // Editor controls floating/detach
  floatingEditorControls: boolean;
  setFloatingEditorControls: (v: boolean) => void;
  // Allow floating/detaching of the editor canvas (graph)
  floatingEditorCanvas: boolean;
  setFloatingEditorCanvas: (v: boolean) => void;

  // Detached preview window (separate OS window)
  previewDetachedWindow: boolean;
  setPreviewDetachedWindow: (v: boolean) => void;

  // Props deletion confirmation preference
  suppressPropDeleteConfirm: boolean;

  // Accordion sidebar
  useAccordionSidebar: boolean;
  sidebarSectionOrder: SidebarSectionId[];
  sidebarExpanded: Record<SidebarSectionId, boolean>;

  // Bookmarks
  bookmarks: Map<number, Bookmark>;
  // Docking assignments: componentId -> dockZoneId | null
  dockAssignments: Record<string, string | null>;
  // Active tab per dock zone
  dockZoneActivePanel: Record<string, string | null>;
  setDockAssignment: (componentId: string, zoneId: string | null) => void;
  setDockZoneActivePanel: (zoneId: string, panelId: string | null) => void;
  setFloatingPanelById: (panelId: string, floating: boolean) => void;

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

  // Accordion sidebar actions
  toggleAccordionSidebar: () => void;
  toggleSection: (id: SidebarSectionId) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Bookmark actions
  setBookmark: (slot: number, bookmark: Bookmark) => void;
  removeBookmark: (slot: number) => void;
  renameBookmark: (slot: number, label: string) => void;
  reloadBookmarks: (filePath?: string, projectPath?: string, biomeSection?: string) => void;
  clearBookmarks: () => void;
  // Panel visibility (Window > Panels)
  panelVisibility: Record<string, boolean>;
  setPanelVisibility: (panelId: string, visible: boolean) => void;
  togglePanelVisibility: (panelId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showGrid: getStoredBool("tn-showGrid", false),
  snapToGrid: getStoredBool("tn-snapToGrid", false),
  gridSize: getStoredNumber("tn-grid-size", 20, 4, 128),
  showMinimap: getStoredBool("tn-showMinimap", true),
  leftPanelVisible: getStoredBool("tn-leftPanel", true),
  rightPanelVisible: getStoredBool("tn-rightPanel", true),
  helpMode: false,
  // UI settings dialog
  settingsOpen: false,
  setSettingsOpen: (v: boolean) => set({ settingsOpen: v }),

  // Preview HUD visibility
  previewHudVisible: getStoredBool("tn-preview-hud-visible", true),
  setPreviewHudVisible: (v: boolean) => {
    persist("tn-preview-hud-visible", v);
    set({ previewHudVisible: v });
  },
  setGridSize: (v: number) => {
    const safe = clampNumber(v, 4, 128);
    try { localStorage.setItem("tn-grid-size", String(safe)); } catch {}
    set({ gridSize: safe });
  },
  // Snap-back behavior for floating panels
  snapBackEnabled: getStoredBool("tn-snap-back-enabled", true),
  setSnapBackEnabled: (v: boolean) => {
    persist("tn-snap-back-enabled", v);
    set({ snapBackEnabled: v });
  },
  snapEdgeThreshold: getStoredNumber("tn-snap-edge-threshold", 80, MIN_SNAP_EDGE_THRESHOLD, MAX_SNAP_EDGE_THRESHOLD),
  setSnapEdgeThreshold: (v: number) => {
    const safe = clampNumber(v, MIN_SNAP_EDGE_THRESHOLD, MAX_SNAP_EDGE_THRESHOLD);
    try { localStorage.setItem("tn-snap-edge-threshold", String(safe)); } catch {}
    set({ snapEdgeThreshold: safe });
  },
  // Floating panels: allow moving Shared Controls and Materials legend
  floatingSharedControls: getStoredBool("tn-floating-shared-controls", false),
  setFloatingSharedControls: (v: boolean) => {
    persist("tn-floating-shared-controls", v);
    set({ floatingSharedControls: v });
  },
  // Allow floating/detaching of the full preview controls pane
  floatingPreviewControls: getStoredBool("tn-floating-preview-controls", false),
  setFloatingPreviewControls: (v: boolean) => {
    persist("tn-floating-preview-controls", v);
    set({ floatingPreviewControls: v });
  },
  floatingMaterialsLegend: getStoredBool("tn-floating-materials-legend", false),
  setFloatingMaterialsLegend: (v: boolean) => {
    persist("tn-floating-materials-legend", v);
    set({ floatingMaterialsLegend: v });
  },
  floatingViewModeOverlay: getStoredBool("tn-floating-viewmode-overlay", false),
  setFloatingViewModeOverlay: (v: boolean) => {
    persist("tn-floating-viewmode-overlay", v);
    set({ floatingViewModeOverlay: v });
  },
  // Allow floating/detaching of preview and comparison panes
  floatingPreviewPanel: getStoredBool("tn-floating-preview-panel", false),
  setFloatingPreviewPanel: (v: boolean) => {
    persist("tn-floating-preview-panel", v);
    set({ floatingPreviewPanel: v });
  },
  floatingComparisonView: getStoredBool("tn-floating-comparison-view", false),
  setFloatingComparisonView: (v: boolean) => {
    persist("tn-floating-comparison-view", v);
    set({ floatingComparisonView: v });
  },
  floatingEditorControls: getStoredBool("tn-floating-editor-controls", false),
  setFloatingEditorControls: (v: boolean) => {
    persist("tn-floating-editor-controls", v);
    set({ floatingEditorControls: v });
  },
  floatingEditorCanvas: getStoredBool("tn-floating-editor-canvas", false),
  // Editor canvas floating is disabled — keep API but force false so other
  // callers remain safe while preventing the canvas from being detached.
  setFloatingEditorCanvas: (_v: boolean) => {
    try { persist("tn-floating-editor-canvas", false); } catch {}
    set({ floatingEditorCanvas: false });
  },
  // Detached preview window (separate OS window)
  previewDetachedWindow: getStoredBool("tn-preview-detached", false),
  setPreviewDetachedWindow: (v: boolean) => {
    persist("tn-preview-detached", v);
    set({ previewDetachedWindow: v });
  },
  suppressPropDeleteConfirm: getStoredBool("tn-suppressPropDeleteConfirm", false),
  useAccordionSidebar: getStoredBool("tn-accordionSidebar", false),
  sidebarSectionOrder: getStoredJson<SidebarSectionId[]>("tn-sidebar-order", DEFAULT_SECTION_ORDER),
  sidebarExpanded: getStoredJson<Record<SidebarSectionId, boolean>>("tn-sidebar-expanded", DEFAULT_SECTION_EXPANDED),
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

  toggleAccordionSidebar: () => {
    const next = !get().useAccordionSidebar;
    persist("tn-accordionSidebar", next);
    set({ useAccordionSidebar: next });
  },

  toggleSection: (id) => {
    const expanded = { ...get().sidebarExpanded, [id]: !get().sidebarExpanded[id] };
    persistJson("tn-sidebar-expanded", expanded);
    set({ sidebarExpanded: expanded });
  },

  reorderSections: (fromIndex, toIndex) => {
    const order = [...get().sidebarSectionOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    persistJson("tn-sidebar-order", order);
    set({ sidebarSectionOrder: order });
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
  // Panel visibility defaults
  panelVisibility: getStoredJson<Record<string, boolean>>(
    "tn-panel-visibility",
    {
      Graph: true,
      Preview: true,
      Compare: false,
      Inspector: true,
      Console: false,
      BiomeResolver: false,
    },
  ),
  setPanelVisibility: (panelId: string, visible: boolean) => {
    try {
      const current = { ...(get().panelVisibility || {}) } as Record<string, boolean>;
      current[panelId] = visible;
      persistJson("tn-panel-visibility", current);
      set({ panelVisibility: current });
    } catch {
      // ignore
    }
  },
  togglePanelVisibility: (panelId: string) => {
    const cur = get().panelVisibility || {};
    const next = !cur[panelId];
    try {
      const updated = { ...cur, [panelId]: next };
      persistJson("tn-panel-visibility", updated);
      set({ panelVisibility: updated });
    } catch {
      // ignore
    }
  },
  // Dock assignments persisted across sessions
  dockAssignments: getStoredJson<Record<string, string | null>>("tn-dock-assignments", {}),
  dockZoneActivePanel: getStoredJson<Record<string, string | null>>("tn-dock-zone-active", {}),
  // Floating panels stacking order (z-order). Stored as array with back = top
  floatingOrder: getStoredJson<string[]>("tn-floating-order", []),
  setDockAssignment: (componentId: string, zoneId: string | null) => {
    try {
      const current = { ...get().dockAssignments } as Record<string, string | null>;
      const active = { ...get().dockZoneActivePanel } as Record<string, string | null>;
      const previousZone = current[componentId] ?? null;

      if (zoneId === null) {
        delete current[componentId];
      } else {
        current[componentId] = zoneId;
      }

      if (previousZone && previousZone !== zoneId && active[previousZone] === componentId) {
        const nextInPrevious = Object.entries(current).find(([, z]) => z === previousZone)?.[0] ?? null;
        if (nextInPrevious === null) delete active[previousZone];
        else active[previousZone] = nextInPrevious;
      }

      if (zoneId) {
        if (!active[zoneId]) active[zoneId] = componentId;
      }

      persistJson("tn-dock-assignments", current);
      persistJson("tn-dock-zone-active", active);
      set({ dockAssignments: current, dockZoneActivePanel: active });
    } catch {
      // ignore
    }
  },
  bringFloatingToFront: (panelId: string) => {
    try {
      const current = [...get().floatingOrder];
      const idx = current.indexOf(panelId);
      if (idx !== -1) current.splice(idx, 1);
      current.push(panelId);
      persistJson("tn-floating-order", current);
      set({ floatingOrder: current });
    } catch {
      // ignore
    }
  },
  sendFloatingToBack: (panelId: string) => {
    try {
      const current = [...get().floatingOrder];
      const idx = current.indexOf(panelId);
      if (idx !== -1) current.splice(idx, 1);
      current.unshift(panelId);
      persistJson("tn-floating-order", current);
      set({ floatingOrder: current });
    } catch {
      // ignore
    }
  },
  setDockZoneActivePanel: (zoneId: string, panelId: string | null) => {
    try {
      const active = { ...get().dockZoneActivePanel } as Record<string, string | null>;
      if (!panelId) delete active[zoneId];
      else active[zoneId] = panelId;
      persistJson("tn-dock-zone-active", active);
      set({ dockZoneActivePanel: active });
    } catch {
      // ignore
    }
  },
  setFloatingPanelById: (panelId: string, floating: boolean) => {
    const state = get();
    switch (panelId as FloatingPanelId) {
      case "shared-controls":
        state.setFloatingSharedControls(floating);
        break;
      case "materials-legend":
        state.setFloatingMaterialsLegend(floating);
        break;
      case "viewmode-overlay":
        state.setFloatingViewModeOverlay(floating);
        break;
      case "preview-panel":
        state.setFloatingPreviewPanel(floating);
        break;
      case "comparison-view":
        state.setFloatingComparisonView(floating);
        break;
      case "preview-controls":
        state.setFloatingPreviewControls(floating);
        break;
      case "editor-controls":
        state.setFloatingEditorControls(floating);
        break;
      case "editor-canvas":
        state.setFloatingEditorCanvas(floating);
        break;
      default:
        break;
    }
  },
}));

// Subscribe to project:close to clear bookmarks
on("project:close", () => {
  useUIStore.getState().clearBookmarks();
});
