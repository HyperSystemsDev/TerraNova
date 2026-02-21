import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState, useRef } from "react";
import { isMac } from "@/utils/platform";
import { useUIStore, DEFAULT_DOCK_ZONE_BY_COMPONENT } from "@/stores/uiStore";

function IconFor(id: string) {
  switch (id) {
    case "shared-controls":
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3"/><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>;
    case "materials-legend":
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/></svg>;
    case "preview-controls":
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>;
    case "editor-controls":
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case "editor-canvas":
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="2"/></svg>;
    default:
      return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/></svg>;
  }
}

function readPinned(id: string) {
  try { return localStorage.getItem(`tn-${id}-pinned`) === "true"; } catch { return false; }
}

function loadLayoutPresets(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem("tn-layout-presets") || "{}"); } catch { return {}; }
}

function saveLayoutPreset(name: string, state: any) {
  try {
    const all = loadLayoutPresets();
    all[name] = state;
    localStorage.setItem("tn-layout-presets", JSON.stringify(all));
  } catch {}
}

function removeLayoutPreset(name: string) {
  try { const all = loadLayoutPresets(); delete all[name]; localStorage.setItem("tn-layout-presets", JSON.stringify(all)); } catch {}
}

// Simple title bar for home screen (no menus, no ReactFlow dependencies)
export function SimpleTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();
  const [windowMenuOpen, setWindowMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const panelVisibility = useUIStore((s) => s.panelVisibility);
  const togglePanelVisibility = useUIStore((s) => s.togglePanelVisibility);
  const setDockAssignment = useUIStore((s) => s.setDockAssignment);
  const setFloatingPanelById = useUIStore((s) => s.setFloatingPanelById);
  const setDockZoneActivePanel = useUIStore((s) => s.setDockZoneActivePanel);

  useEffect(() => {
    if (isMac) return;

    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  // Close menu on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setWindowMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  // On macOS, native traffic lights handle window controls — just render a minimal drag region
  if (isMac) {
    return (
      <div className="h-8 bg-tn-panel border-b border-tn-border flex items-center select-none shrink-0" />
    );
  }

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (!(ev.ctrlKey || ev.metaKey) || !ev.altKey) return;
      const key = ev.key;
      const compIds = Object.keys(DEFAULT_DOCK_ZONE_BY_COMPONENT);
      const idx = Number(key) - 1;
      if (Number.isFinite(idx) && idx >= 0 && idx < compIds.length) {
        const compId = compIds[idx];
        try { localStorage.removeItem(`tn-${compId}-minimized`); } catch {}
        const defaultZone = DEFAULT_DOCK_ZONE_BY_COMPONENT[compId] ?? null;
        try {
          if (defaultZone) setDockAssignment(compId, defaultZone);
          setFloatingPanelById(compId, false);
          if (defaultZone) setDockZoneActivePanel(defaultZone, compId);
        } catch {}
        window.dispatchEvent(new CustomEvent("tn-workspace-loaded"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setDockAssignment, setDockZoneActivePanel, setFloatingPanelById]);

  return (
    <div className="h-8 bg-tn-panel border-b border-tn-border flex items-center justify-between select-none shrink-0">
      {/* Left menu (not draggable) */}
      <div className="flex items-center gap-2 px-2">
        <div className="text-[12px] text-tn-text-muted px-2 py-1">File</div>
        <div className="text-[12px] text-tn-text-muted px-2 py-1">Edit</div>
        <div className="text-[12px] text-tn-text-muted px-2 py-1">View</div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setWindowMenuOpen((s) => !s)}
            className={`text-[12px] px-2 py-1 rounded ${windowMenuOpen ? "bg-tn-surface text-tn-text" : "text-tn-text-muted"}`}
          >
            Window
          </button>

          {windowMenuOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-tn-panel border border-tn-border rounded shadow-lg z-50">
                <div className="p-2 text-xs text-tn-text-muted flex items-center gap-2">
                  <svg className="w-4 h-4 text-tn-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="14" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  <span className="sr-only">Panels</span>
                </div>
                <div className="divide-y divide-tn-border">
                  {[
                    "Graph",
                    "Preview",
                    "Compare",
                    "Inspector",
                    "Console",
                    "BiomeResolver",
                  ].map((id) => (
                    <label key={id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-tn-surface">
                      <input
                        type="checkbox"
                        checked={!!panelVisibility?.[id]}
                        onChange={() => togglePanelVisibility(id)}
                      />
                      <span className="text-sm">{id}</span>
                    </label>
                  ))}
                </div>

                <div className="p-2 text-xs text-tn-text-muted">Palettes & Tools</div>
                <div className="px-2 py-1">
                  <div className="flex gap-1">
                    <button className="text-xs px-2 py-1 rounded bg-tn-panel-darker" onClick={() => {
                      const name = window.prompt("Save layout as:");
                      if (!name) return;
                      const state: Record<string, any> = {
                        dockAssignments: useUIStore.getState().dockAssignments,
                        dockZoneActivePanel: useUIStore.getState().dockZoneActivePanel,
                        panelVisibility: useUIStore.getState().panelVisibility,
                        panels: {},
                      };

                      for (const compId of Object.keys(DEFAULT_DOCK_ZONE_BY_COMPONENT)) {
                        try {
                          const pos = localStorage.getItem(`tn-${compId}-pos`);
                          const size = localStorage.getItem(`tn-${compId}-size`);
                          const anchor = localStorage.getItem(`tn-${compId}-anchor`);
                          const minimized = localStorage.getItem(`tn-${compId}-minimized`);
                          const pinned = localStorage.getItem(`tn-${compId}-pinned`);
                          state.panels[compId] = { pos, size, anchor, minimized, pinned };
                        } catch {
                          // ignore
                        }
                      }

                      const existing = loadLayoutPresets();
                      if (existing[name] && !window.confirm(`Overwrite preset '${name}'?`)) return;
                      saveLayoutPreset(name, state);
                    }}>Save layout</button>
                    <div className="relative">
                      <button className="text-xs px-2 py-1 rounded bg-tn-panel-darker">Restore</button>
                      <div className="absolute left-0 mt-1 w-48 bg-tn-panel border border-tn-border rounded shadow-lg z-50">
                        {Object.keys(loadLayoutPresets()).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-tn-text-muted">No presets</div>
                        ) : Object.keys(loadLayoutPresets()).map((name) => (
                          <div key={name} className="flex items-center justify-between px-3 py-1 hover:bg-tn-surface">
                            <button className="text-sm text-left w-full" onClick={() => {
                              const presets = loadLayoutPresets();
                              const p = presets[name];
                              if (!p) return;
                              try {
                                // restore dock assignments
                                const assignments = p.dockAssignments ?? {};
                                for (const [compId, zone] of Object.entries(assignments)) {
                                  setDockAssignment(compId, zone as string | null);
                                }
                                const active = p.dockZoneActivePanel ?? {};
                                for (const [zoneId, panelId] of Object.entries(active)) {
                                  setDockZoneActivePanel(zoneId, panelId as string | null);
                                }
                                const vis = p.panelVisibility ?? {};
                                for (const [panelId, visv] of Object.entries(vis)) {
                                  useUIStore.getState().setPanelVisibility(panelId, !!visv);
                                }

                                // restore per-panel stored keys (pos/size/anchor/minimized/pinned)
                                const panels = p.panels ?? {} as Record<string, any>;
                                for (const [compId, raw] of Object.entries(panels)) {
                                  try {
                                    const data = raw as Record<string, string | null | undefined>;
                                    const pos = data.pos ?? null;
                                    const size = data.size ?? null;
                                    const anchor = data.anchor ?? null;
                                    const minimizedVal = data.minimized ?? null;
                                    const pinnedVal = data.pinned ?? null;

                                    if (pos === null) localStorage.removeItem(`tn-${compId}-pos`);
                                    else if (typeof pos === "string") localStorage.setItem(`tn-${compId}-pos`, pos);

                                    if (size === null) localStorage.removeItem(`tn-${compId}-size`);
                                    else if (typeof size === "string") localStorage.setItem(`tn-${compId}-size`, size);

                                    if (anchor === null) localStorage.removeItem(`tn-${compId}-anchor`);
                                    else if (typeof anchor === "string") localStorage.setItem(`tn-${compId}-anchor`, anchor);

                                    if (minimizedVal === null) localStorage.removeItem(`tn-${compId}-minimized`);
                                    else if (typeof minimizedVal === "string") localStorage.setItem(`tn-${compId}-minimized`, minimizedVal);

                                    if (pinnedVal === null) localStorage.removeItem(`tn-${compId}-pinned`);
                                    else if (typeof pinnedVal === "string") localStorage.setItem(`tn-${compId}-pinned`, pinnedVal);
                                  } catch {}
                                }
                              } catch {}
                              window.dispatchEvent(new CustomEvent("tn-workspace-loaded"));
                            }}>{name}</button>
                            <button className="text-xs px-2" onClick={() => { removeLayoutPreset(name); }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-tn-border">
                  {Object.keys(DEFAULT_DOCK_ZONE_BY_COMPONENT).map((compId) => {
                    const label = compId.split("-").map((p) => p[0]?.toUpperCase() + p.slice(1)).join(" ");
                    const pinned = readPinned(compId);
                    const minimized = localStorage.getItem(`tn-${compId}-minimized`) === "true";
                    return (
                      <div key={compId} className="flex items-center justify-between px-3 py-2 hover:bg-tn-surface">
                        <div className="flex items-center gap-2">
                          <div className="text-tn-text-muted">{IconFor(compId)}</div>
                          <button className="text-sm text-left" onClick={() => {
                            try { localStorage.removeItem(`tn-${compId}-minimized`); } catch {}
                            const defaultZone = DEFAULT_DOCK_ZONE_BY_COMPONENT[compId] ?? null;
                            try {
                              if (defaultZone) setDockAssignment(compId, defaultZone);
                              setFloatingPanelById(compId, false);
                              if (defaultZone) setDockZoneActivePanel(defaultZone, compId);
                            } catch {}
                            window.dispatchEvent(new CustomEvent("tn-workspace-loaded"));
                          }}>{label}</button>
                          {pinned ? <span className="text-tn-accent ml-1">📌</span> : null}
                          {minimized ? <span className="text-xs text-amber-400 ml-1">(min)</span> : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <input title="Visible" type="checkbox" checked={!minimized} onChange={() => {
                            if (!minimized) { try { localStorage.setItem(`tn-${compId}-minimized`, "true"); } catch {} }
                            else { try { localStorage.removeItem(`tn-${compId}-minimized`); } catch {} }
                            window.dispatchEvent(new CustomEvent("tn-workspace-loaded"));
                          }} />
                          <button title="Pin" className="text-xs px-2" onClick={() => { try { localStorage.setItem(`tn-${compId}-pinned`, (!pinned).toString()); } catch {} }}>{pinned ? "Unpin" : "Pin"}</button>
                          <button title="Float" className="text-xs px-2" onClick={() => { try { setDockAssignment(compId, null); setFloatingPanelById(compId, true); } catch {} }}>⇱</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag region occupies center to allow window dragging */}
      <div data-tauri-drag-region className="flex-1" />

      {/* Keyboard shortcuts to restore palettes: Ctrl+Alt+1..9 */}
      <script />

      <div className="flex items-center gap-0">
        <button
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-tn-surface transition-colors text-tn-text-muted hover:text-tn-text"
          title="Minimize"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-tn-surface transition-colors text-tn-text-muted hover:text-tn-text"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-tn-text-muted hover:text-white"
          title="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Export as TitleBar for backward compatibility
export { SimpleTitleBar as TitleBar };
