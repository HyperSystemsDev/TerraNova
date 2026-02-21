import { useEffect, useRef, useState } from "react";
import { MAX_SNAP_EDGE_THRESHOLD, MIN_SNAP_EDGE_THRESHOLD, useUIStore } from "@/stores/uiStore";
import { usePreviewStore } from "@/stores/previewStore";

type StoredPosition = {
  pos: string | null;
  anchor: string | null;
};

type WorkspaceDump = {
  name: string;
  createdAt: string;
  flags: {
    previewHudVisible: boolean;
    floatingSharedControls: boolean;
    floatingMaterialsLegend: boolean;
    floatingViewModeOverlay: boolean;
    floatingPreviewPanel: boolean;
    floatingComparisonView: boolean;
    floatingPreviewControls?: boolean;
    floatingEditorCanvas?: boolean;
  };
  positions: Record<string, StoredPosition>;
};

export function UISettingsDialog() {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const isOpen = useUIStore((s) => s.settingsOpen);
  const setOpen = useUIStore((s) => s.setSettingsOpen);
  const hudVisible = useUIStore((s) => s.previewHudVisible);
  const setHudVisible = useUIStore((s) => s.setPreviewHudVisible);
  const setFloatingShared = useUIStore((s) => s.setFloatingSharedControls);
  const setFloatingMaterials = useUIStore((s) => s.setFloatingMaterialsLegend);
  const setFloatingView = useUIStore((s) => s.setFloatingViewModeOverlay);
  const setFloatingPreview = useUIStore((s) => s.setFloatingPreviewPanel);
  const setFloatingComparison = useUIStore((s) => s.setFloatingComparisonView);
  const snapBackEnabled = useUIStore((s) => s.snapBackEnabled);
  const setSnapBackEnabled = useUIStore((s) => s.setSnapBackEnabled);
  const snapEdgeThreshold = useUIStore((s) => s.snapEdgeThreshold);
  const setSnapEdgeThreshold = useUIStore((s) => s.setSnapEdgeThreshold);
  const [localHudVisible, setLocalHudVisible] = useState(hudVisible);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("tn-workspace-list");
      return raw ? JSON.parse(raw) as string[] : [];
    } catch { return []; }
  });
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const componentsForSizing = [
    { id: "preview-panel", label: "Preview Panel" },
    { id: "materials-legend", label: "Materials Legend" },
    { id: "shared-controls", label: "Shared Controls" },
    { id: "comparison-view", label: "Comparison View" },
    { id: "editor-canvas", label: "Editor Canvas" },
    { id: "preview-controls", label: "Preview Controls" },
  ];
  const floatingEditorCanvas = useUIStore((s) => s.floatingEditorCanvas);
  const setFloatingEditorCanvas = useUIStore((s) => s.setFloatingEditorCanvas);
  const floatingPreviewControls = useUIStore((s) => s.floatingPreviewControls);
  const setFloatingPreviewControls = useUIStore((s) => s.setFloatingPreviewControls);
  const [sizes, setSizes] = useState<Record<string, { w?: number; h?: number }>>(() => {
    const out: Record<string, { w?: number; h?: number }> = {};
    for (const c of componentsForSizing) {
      try {
        const raw = localStorage.getItem(`tn-${c.id}-size`);
        out[c.id] = raw ? JSON.parse(raw) as { w?: number; h?: number } : { w: undefined, h: undefined };
      } catch { out[c.id] = { w: undefined, h: undefined }; }
    }
    return out;
  });

  const [anchors, setAnchors] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const c of componentsForSizing) {
      try {
        const raw = localStorage.getItem(`tn-${c.id}-anchor`);
        out[c.id] = raw ?? "";
      } catch {
        out[c.id] = "";
      }
    }
    return out;
  });

  useEffect(() => setLocalHudVisible(hudVisible), [hudVisible]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const getFocusable = () => Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    const focusable = getFocusable();
    (focusable[0] ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const candidates = getFocusable();
      if (candidates.length === 0) {
        event.preventDefault();
        return;
      }

      const first = candidates[0];
      const last = candidates[candidates.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  function onClose() {
    setOpen(false);
  }

  function resetHudPosition() {
    try {
      localStorage.removeItem("tn-preview-hud-pos");
      localStorage.removeItem("tn-preview-hud-anchor");
    } catch {}
    // reset store-backed HUD values
    usePreviewStore.getState().setTimeOfDay(12); // noop to trigger any needed updates
  }

  function saveWorkspace(name: string) {
    if (!name) return;
    const dump: WorkspaceDump = {
      name,
      createdAt: new Date().toISOString(),
      flags: ((): WorkspaceDump["flags"] => {
        // keep track of current store flags (do not offer toggles; docking is drag-based)
        const ui = useUIStore.getState();
        return {
          previewHudVisible: localHudVisible,
          floatingSharedControls: ui.floatingSharedControls,
          floatingMaterialsLegend: ui.floatingMaterialsLegend,
          floatingViewModeOverlay: ui.floatingViewModeOverlay,
          floatingPreviewPanel: ui.floatingPreviewPanel,
          floatingComparisonView: ui.floatingComparisonView,
          floatingPreviewControls: ui.floatingPreviewControls,
          floatingEditorCanvas: ui.floatingEditorCanvas,
        };
      })(),
      positions: {
        "preview-hud": {
          pos: localStorage.getItem("tn-preview-hud-pos"),
          anchor: localStorage.getItem("tn-preview-hud-anchor"),
        },
        "shared-controls": {
          pos: localStorage.getItem("tn-shared-controls-pos"),
          anchor: localStorage.getItem("tn-shared-controls-anchor"),
        },
        "materials-legend": {
          pos: localStorage.getItem("tn-materials-legend-pos"),
          anchor: localStorage.getItem("tn-materials-legend-anchor"),
        },
        "preview-panel": {
          pos: localStorage.getItem("tn-preview-panel-pos"),
          anchor: localStorage.getItem("tn-preview-panel-anchor"),
        },
        "comparison-view": {
          pos: localStorage.getItem("tn-comparison-view-pos"),
          anchor: localStorage.getItem("tn-comparison-view-anchor"),
        },
        "viewmode-overlay": {
          pos: localStorage.getItem("tn-viewmode-overlay-pos"),
          anchor: localStorage.getItem("tn-viewmode-overlay-anchor"),
        },
        "preview-controls": {
          pos: localStorage.getItem("tn-preview-controls-pos"),
          anchor: localStorage.getItem("tn-preview-controls-anchor"),
        },
        "editor-canvas": {
          pos: localStorage.getItem("tn-editor-canvas-pos"),
          anchor: localStorage.getItem("tn-editor-canvas-anchor"),
        },
      },
    };
    try {
      localStorage.setItem(`tn-workspace:${name}`, JSON.stringify(dump));
      const updated = Array.from(new Set([...(workspaces || []), name]));
      localStorage.setItem("tn-workspace-list", JSON.stringify(updated));
      setWorkspaces(updated);
      setWorkspaceName("");
    } catch {
      // ignore
    }
  }

  function loadWorkspace(name: string) {
    try {
      const raw = localStorage.getItem(`tn-workspace:${name}`);
      if (!raw) return;
      const dump = JSON.parse(raw) as WorkspaceDump;
      // restore flags
      setHudVisible(dump.flags.previewHudVisible);
      setFloatingShared(dump.flags.floatingSharedControls);
      setFloatingMaterials(dump.flags.floatingMaterialsLegend);
      setFloatingView(dump.flags.floatingViewModeOverlay);
      setFloatingPreview(dump.flags.floatingPreviewPanel ?? false);
      setFloatingComparison(dump.flags.floatingComparisonView ?? false);
      setFloatingPreviewControls(dump.flags.floatingPreviewControls ?? false);
      setFloatingEditorCanvas(dump.flags.floatingEditorCanvas ?? false);
      // restore positions (write back to localStorage)
      // positions keys are stored using the exact component ids
      const mapping = {
        "preview-hud": "preview-hud",
        "shared-controls": "shared-controls",
        "materials-legend": "materials-legend",
        "preview-panel": "preview-panel",
        "comparison-view": "comparison-view",
        "viewmode-overlay": "viewmode-overlay",
        "preview-controls": "preview-controls",
        "editor-canvas": "editor-canvas",
      } as Record<string, string>;
      for (const [k, value] of Object.entries(dump.positions)) {
        if (!value || typeof value !== "object") continue;
        const id = mapping[k] ?? k;
        if (value.pos !== null) localStorage.setItem(`tn-${id}-pos`, value.pos);
        else localStorage.removeItem(`tn-${id}-pos`);
        if (value.anchor !== null) localStorage.setItem(`tn-${id}-anchor`, value.anchor);
        else localStorage.removeItem(`tn-${id}-anchor`);
      }
      window.dispatchEvent(new CustomEvent("tn-workspace-loaded", { detail: { name } }));
    } catch {
      // ignore
    }
  }

  function deleteWorkspace(name: string) {
    try {
      localStorage.removeItem(`tn-workspace:${name}`);
      const updated = (workspaces || []).filter((w) => w !== name);
      localStorage.setItem("tn-workspace-list", JSON.stringify(updated));
      setWorkspaces(updated);
      if (selectedWorkspace === name) setSelectedWorkspace(null);
    } catch {}
  }

  function saveComponentSize(id: string) {
    try {
      const s = sizes[id] || {};
      localStorage.setItem(`tn-${id}-size`, JSON.stringify(s));
      // notify any floating boxes to re-read size
      try { window.dispatchEvent(new CustomEvent("tn-size-changed", { detail: { id } })); } catch {}
    } catch {}
  }

  function saveComponentAnchor(id: string) {
    try {
      const a = anchors[id] ?? "";
      if (!a) localStorage.removeItem(`tn-${id}-anchor`);
      else localStorage.setItem(`tn-${id}-anchor`, a);
      try { window.dispatchEvent(new CustomEvent("tn-workspace-loaded", { detail: { name: "anchor-changed" } })); } catch {}
    } catch {}
  }

  function resetComponentAnchor(id: string) {
    try {
      localStorage.removeItem(`tn-${id}-anchor`);
      setAnchors((s) => ({ ...s, [id]: "" }));
      try { window.dispatchEvent(new CustomEvent("tn-workspace-loaded", { detail: { name: "anchor-reset" } })); } catch {}
    } catch {}
  }

  function resetAllPositionsAndAnchors() {
    try {
      for (const c of componentsForSizing) {
        localStorage.removeItem(`tn-${c.id}-pos`);
        localStorage.removeItem(`tn-${c.id}-anchor`);
        localStorage.removeItem(`tn-${c.id}-size`);
      }
      // notify floating boxes to re-read
      try { window.dispatchEvent(new CustomEvent("tn-workspace-loaded", { detail: { name: "reset-all" } })); } catch {}
      // update local UI state
      const nextSizes: Record<string, { w?: number; h?: number }> = {};
      const nextAnchors: Record<string, string> = {};
      for (const c of componentsForSizing) { nextSizes[c.id] = { w: undefined, h: undefined }; nextAnchors[c.id] = ""; }
      setSizes(nextSizes);
      setAnchors(nextAnchors);
    } catch {}
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-settings-title"
        tabIndex={-1}
        className="bg-tn-panel border border-tn-border rounded-lg shadow-xl w-[420px] max-h-[80vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="ui-settings-title" className="text-base font-semibold">UI Settings</h2>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Preview HUD</div>
              <div className="text-xs text-tn-text-muted">Toggle the overlay that shows TimeOfDay and preview controls.</div>
            </div>
            <div>
              <input type="checkbox" checked={localHudVisible} onChange={(e) => setLocalHudVisible(e.target.checked)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Reset HUD Position</div>
              <div className="text-xs text-tn-text-muted">If the HUD is off-screen, reset it to the default corner.</div>
            </div>
            <div>
              <button className="px-3 py-1 bg-tn-surface border border-tn-border rounded" onClick={resetHudPosition}>Reset</button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-tn-border pt-3">
            <div>
              <div className="text-sm font-medium">Floating panels</div>
              <div className="text-xs text-tn-text-muted">Panels are now detachable by dragging them out of their pane or by right-clicking and choosing "Detach". Use the Dock to drop and organize palettes.</div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Snap-back to Dock</div>
                <div className="text-xs text-tn-text-muted">When enabled, dragging a floating panel near the edge will attempt to dock it automatically.</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={snapBackEnabled} onChange={(e) => setSnapBackEnabled(e.target.checked)} />
                <input
                  type="number"
                  min={MIN_SNAP_EDGE_THRESHOLD}
                  max={MAX_SNAP_EDGE_THRESHOLD}
                  className="w-20 ml-2 bg-tn-surface border border-tn-border rounded px-2 py-1"
                  value={snapEdgeThreshold}
                  onChange={(e) => {
                    const next = e.currentTarget.valueAsNumber;
                    if (Number.isNaN(next)) return;
                    setSnapEdgeThreshold(next);
                  }}
                  title="Edge threshold in pixels"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Float Preview Controls</div>
                <div className="text-xs text-tn-text-muted">If enabled, the preview controls can be detached and moved independently.</div>
              </div>
              <div>
                <input type="checkbox" checked={floatingPreviewControls} onChange={(e) => setFloatingPreviewControls(e.target.checked)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Float Editor Canvas</div>
                <div className="text-xs text-tn-text-muted">Allow detaching and moving the main graph canvas.</div>
              </div>
              <div>
                <input type="checkbox" checked={floatingEditorCanvas} onChange={(e) => setFloatingEditorCanvas(e.target.checked)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input className="flex-1 bg-tn-surface border border-tn-border rounded px-2 py-1" placeholder="Workspace name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
              <button className="px-3 py-1 bg-tn-accent text-white rounded" onClick={() => saveWorkspace(workspaceName)}>Save Workspace</button>
            </div>

            <div className="flex flex-col gap-2 border-t border-tn-border pt-3">
              <div className="text-sm font-medium">Component Sizes</div>
              <div className="text-xs text-tn-text-muted">Adjust width/height (pixels) for floating components. Press Save to apply.</div>
              {componentsForSizing.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-40">
                    <div className="text-sm">{c.label}</div>
                  </div>
                  <select
                    className="bg-tn-surface border border-tn-border rounded px-2 py-1"
                    value={anchors[c.id] ?? ""}
                    onChange={(e) => setAnchors((s) => ({ ...s, [c.id]: e.target.value }))}
                  >
                    <option value="">Default</option>
                    <option value="top-left">Top-left</option>
                    <option value="top-right">Top-right</option>
                    <option value="bottom-left">Bottom-left</option>
                    <option value="bottom-right">Bottom-right</option>
                  </select>
                  <input
                    type="number"
                    className="w-20 bg-tn-surface border border-tn-border rounded px-2 py-1"
                    placeholder="w"
                    value={sizes[c.id]?.w ?? ""}
                    onChange={(e) => setSizes((s) => ({ ...s, [c.id]: { ...s[c.id], w: e.target.value ? Number(e.target.value) : undefined } }))}
                  />
                  <input
                    type="number"
                    className="w-20 bg-tn-surface border border-tn-border rounded px-2 py-1"
                    placeholder="h"
                    value={sizes[c.id]?.h ?? ""}
                    onChange={(e) => setSizes((s) => ({ ...s, [c.id]: { ...s[c.id], h: e.target.value ? Number(e.target.value) : undefined } }))}
                  />
                  <button className="px-2 py-1 bg-tn-panel-darker rounded" onClick={() => { saveComponentSize(c.id); saveComponentAnchor(c.id); }}>Save</button>
                  <button className="px-2 py-1 bg-tn-panel-darker rounded" onClick={() => { saveComponentAnchor(c.id); }}>Save anchor</button>
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => { localStorage.removeItem(`tn-${c.id}-size`); setSizes((s) => ({ ...s, [c.id]: { w: undefined, h: undefined } })); window.dispatchEvent(new CustomEvent("tn-size-changed", { detail: { id: c.id } })); }}>Reset size</button>
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => { resetComponentAnchor(c.id); }}>Reset anchor</button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => resetAllPositionsAndAnchors()}>Reset all positions & anchors</button>
            </div>

            <div className="flex items-center gap-2">
              <select className="flex-1 bg-tn-surface border border-tn-border rounded px-2 py-1" value={selectedWorkspace ?? ""} onChange={(e) => setSelectedWorkspace(e.target.value || null)}>
                <option value="">Loaded Workspaces</option>
                {workspaces.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <button className="px-3 py-1 bg-tn-panel-darker rounded" onClick={() => selectedWorkspace && loadWorkspace(selectedWorkspace)}>Load</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => selectedWorkspace && deleteWorkspace(selectedWorkspace)}>Delete</button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded border border-tn-border" onClick={onClose}>Close</button>
              <button className="px-3 py-1 rounded bg-tn-accent text-white" onClick={() => {
                setHudVisible(localHudVisible);
                // Floating/docking is now drag/right-click controlled; nothing to toggle here
                onClose();
              }}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UISettingsDialog;
