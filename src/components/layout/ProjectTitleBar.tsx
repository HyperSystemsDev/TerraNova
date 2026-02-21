import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { useDragStore } from "@/stores/dragStore";
import { useReactFlow } from "@xyflow/react";
import { useTauriIO } from "@/hooks/useTauriIO";
import { useEditorStore } from "@/stores/editorStore";
import { usePreviewStore, type ViewMode } from "@/stores/previewStore";
import { useBridgeStore } from "@/stores/bridgeStore";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { resolveKeybinding } from "@/config/keybindings";
import { exportAssetPack, exportCurrentJson } from "@/utils/exportAssetPack";
import { isMac } from "@/utils/platform";
import { useProjectStore } from "@/stores/projectStore";

interface MenuItemProps {
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
}

function MenuItem({ label, onClick, shortcut, disabled, checked }: MenuItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-1.5 text-sm flex justify-between gap-6 ${disabled ? "text-tn-text-muted/40 cursor-default" : "hover:bg-tn-accent/20"
        }`}
      onClick={() => {
        if (!disabled) onClick();
      }}
      disabled={disabled}
    >
      <span className="flex items-center gap-2">
        {checked !== undefined ? (
          <span className={`w-3 text-xs ${checked ? "text-tn-accent" : "text-transparent"}`} aria-hidden="true">
            ✓
          </span>
        ) : null}
        <span>{label}</span>
      </span>
      {shortcut && <span className="text-tn-text-muted text-xs">{shortcut}</span>}
    </button>
  );
}

function MenuSeparator() {
  return <div className="border-t border-tn-border my-1" />;
}

function MenuDropdown({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        className="px-3 h-8 text-sm hover:bg-tn-surface rounded"
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-tn-panel border border-tn-border rounded shadow-lg py-1 min-w-[220px] z-50">
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

interface ProjectTitleBarProps {
  onCloseProject: () => void;
  onNewProject: () => void;
  onSettings: () => void;
  onShortcuts: () => void;
  onConfig: () => void;
  onExportSvg: () => void;
}

export function ProjectTitleBar({
  onCloseProject,
  onNewProject,
  onSettings,
  onShortcuts,
  onConfig,
  onExportSvg,
}: ProjectTitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  const { openAssetPack, saveFile, saveFileAs } = useTauriIO();
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const reactFlow = useReactFlow();
  const showInlinePreviews = usePreviewStore((s) => s.showInlinePreviews);
  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const showMinimap = useUIStore((s) => s.showMinimap);
  const leftPanelVisible = useUIStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUIStore((s) => s.rightPanelVisible);
  const helpMode = useUIStore((s) => s.helpMode);
  const useAccordionSidebar = useUIStore((s) => s.useAccordionSidebar);
  const floatingPreviewPanel = useUIStore((s) => s.floatingPreviewPanel);
  const floatingComparisonView = useUIStore((s) => s.floatingComparisonView);
  const floatingViewModeOverlay = useUIStore((s) => s.floatingViewModeOverlay);
  const floatingEditorCanvas = useUIStore((s) => s.floatingEditorCanvas);
  const dockAssignments = useUIStore((s) => s.dockAssignments);
  const setDockAssignment = useUIStore((s) => s.setDockAssignment);
  const flowDirection = useSettingsStore((s) => s.flowDirection);
  const toolbarDocked = (dockAssignments["toolbar"] ?? "toolbar-zone") === "toolbar-zone";

  const selectedCount = useEditorStore((s) => s.nodes.filter((n) => n.selected).length);
  const fileCache = useEditorStore((s) => s.fileCache);
  const cacheKeys = Array.from(fileCache.keys()).slice().reverse(); // recent first
  
  const currentFile = useProjectStore((s) => s.currentFile);
  const setCurrentFile = useProjectStore((s) => s.setCurrentFile);
  const cacheCurrentFile = useEditorStore((s) => s.cacheCurrentFile);
  const restoreFromCache = useEditorStore((s) => s.restoreFromCache);
  const removeCachedFile = useEditorStore((s) => (s as any).removeCachedFile);
  const reorderCachedFiles = useEditorStore((s) => (s as any).reorderCachedFiles);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragInsertBefore, setDragInsertBefore] = useState<boolean>(true);
  const appliedSavedOrder = useRef(false);
  // Tab groups (persisted)
  const [tabGroups, setTabGroups] = useState<Array<{ id: string; name: string; keys: string[]; collapsed?: boolean }>>([]);
  const [selectedForGroup, setSelectedForGroup] = useState<Record<string, boolean>>({});

  // drag ghost support: update global drag cursor when dragging tabs
  const dragOverHandlerRef = useRef<((e: DragEvent) => void) | null>(null);
  const startGlobalTabDrag = (display: string) => {
    try {
      useDragStore.getState().startDrag({ nodeType: "tab", displayType: display, defaults: {} });
      // attach window dragover to update cursor
      const handler = (e: DragEvent) => {
        try { useDragStore.getState().updateCursor(e.clientX, e.clientY); } catch {}
      };
      dragOverHandlerRef.current = handler;
      window.addEventListener("dragover", handler);
    } catch {}
  };
  const endGlobalTabDrag = () => {
    try {
      useDragStore.getState().endDrag();
      if (dragOverHandlerRef.current) {
        window.removeEventListener("dragover", dragOverHandlerRef.current);
        dragOverHandlerRef.current = null;
      }
    } catch {}
  };

  // -- moved below where reorderCachedFiles is defined to avoid TDZ --

  // Load/save tab groups from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tn-tab-order");
      if (!raw) return;
      const saved: string[] = JSON.parse(raw);
      if (!Array.isArray(saved) || saved.length === 0) return;
      // Filter to keys that currently exist
      const filtered = saved.filter((k) => cacheKeys.includes(k));
      if (filtered.length === 0) return;
      // Avoid reapplying repeatedly
      if (appliedSavedOrder.current) return;
      appliedSavedOrder.current = true;
      try { reorderCachedFiles(filtered); } catch {}
    } catch {}
    reactFlow.zoomTo(1, { duration: 300 });
  }

  function handleFitView() {
    reactFlow.fitView({ padding: 0.1, duration: 300 });
  }

  function handleZoomToSelection() {
    const nodes = useEditorStore.getState().nodes.filter((n) => n.selected);
    if (nodes.length === 0) return;
    reactFlow.fitView({
      nodes: nodes.map((n) => ({ id: n.id })),
      padding: 0.2,
      duration: 300,
    });
  }

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

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
  };

  const handleClose = () => {
    appWindow.close();
  };

  return (
    <div
      {...(!isMac ? { "data-tauri-drag-region": true } : {})}
      className="h-8 bg-tn-panel border-b border-tn-border flex items-center justify-between select-none shrink-0"
    >
      <div className="flex items-center">
        {/* Document tabs (Photoshop-like) */}
        <div className="flex items-center gap-1">
          {/* Group controls */}
          <div className="flex items-center gap-2 px-2">
            <button
              className="text-xs px-2 py-1 rounded bg-tn-panel-darker"
              onClick={() => {
                const keys = Object.keys(selectedForGroup).filter(k => selectedForGroup[k]);
                if (keys.length === 0) {
                  alert("Select tabs to group by checking their boxes first.");
                  return;
                }
                const name = window.prompt("Group name:") || `Group ${Date.now()}`;
                const id = `group-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                setTabGroups((prev) => [...prev, { id, name, keys }]);
                setSelectedForGroup({});
              }}
            >Create Group</button>
          </div>
          {currentFile ? (
            <div className="px-3 py-1 text-sm bg-tn-surface border border-tn-border rounded flex items-center gap-2">
              <span className="truncate max-w-[240px]">{currentFile.split(/[/\\]/).pop()}</span>
              <button title="Close" className="text-xs text-tn-text-muted" onClick={() => { cacheCurrentFile(currentFile, true); setCurrentFile(null); }}>×</button>
            </div>
          ) : null}

          {/* Groups: render grouped tabs first */}
          {tabGroups.map((g) => (
            <div key={g.id} className="flex flex-col mr-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs bg-tn-panel-darker rounded">
                <button className="text-xs" onClick={() => setTabGroups((prev) => prev.map(p => p.id === g.id ? { ...p, collapsed: !p.collapsed } : p))}>{g.collapsed ? "▸" : "▾"}</button>
                <div className="font-medium">{g.name} <span className="text-tn-text-muted text-[10px]">({g.keys.length})</span></div>
                <div className="ml-2">
                  <button className="text-xs" onClick={() => setTabGroups((prev) => prev.filter(p => p.id !== g.id))}>✕</button>
                </div>
              </div>
              {!g.collapsed ? (
                <div className="flex gap-1 mt-1">
                  {g.keys.map((k) => (
                    <div key={k} className="px-3 py-1 text-sm bg-tn-panel-darker border border-tn-border rounded flex items-center gap-2">
                      <button className="truncate max-w-[180px] text-left" onClick={() => { restoreFromCache(k); setCurrentFile(k); }}>{k.split(/[/\\]/).pop()}</button>
                      <button title="Close" className="text-xs text-tn-text-muted" onClick={() => removeCachedFile(k)}>×</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {/* Ungrouped cache keys */}
          {cacheKeys.filter(k => !tabGroups.some(g => g.keys.includes(k))).map((k) => (
            <div key={k} className="flex items-center">
              {/* placeholder before if dragging and insert-before true for this key */}
              {dragOverKey === k && dragInsertBefore ? (
                <div className="w-1 h-6 bg-tn-accent/60 mr-2 rounded" />
              ) : null}

              <div
                style={{ display: "flex", alignItems: "center" }}
              >
              <input type="checkbox" className="mr-2" checked={!!selectedForGroup[k]} onChange={() => setSelectedForGroup((s) => ({ ...s, [k]: !s[k] }))} />

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", k);
                  setDraggingKey(k);
                  try { e.dataTransfer.effectAllowed = "move"; } catch {}
                  // hide default drag image so our DragGhost is visible
                  try { e.dataTransfer.setDragImage(new Image(), 0, 0); } catch {}
                  // start global drag ghost tracking
                  startGlobalTabDrag(k.split(/[/\\]/).pop() ?? k);
                  window.dispatchEvent(new CustomEvent("tn-tab-dragstart", { detail: { key: k } }));
                }}
                onDragEnd={() => {
                  setDraggingKey(null);
                  setDragOverKey(null);
                  setDragInsertBefore(true);
                  endGlobalTabDrag();
                  window.dispatchEvent(new CustomEvent("tn-tab-dragend"));
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  // compute whether to insert before/after based on cursor position
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const insertBefore = e.clientX < rect.left + rect.width / 2;
                  setDragOverKey(k);
                  setDragInsertBefore(insertBefore);
                  try { useDragStore.getState().updateCursor(e.clientX, e.clientY); } catch {}
                  window.dispatchEvent(new CustomEvent("tn-tab-dragover", { detail: { target: k, insertBefore } }));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragged = draggingKey ?? e.dataTransfer.getData("text/plain");
                  if (!dragged) return;
                  const uiOrder = cacheKeys.slice(); // recent-first
                  const from = uiOrder.indexOf(dragged);
                  let to = uiOrder.indexOf(k);
                  if (from === -1 || to === -1) return;
                  // if inserting after the target, increment the insertion index
                  if (!dragInsertBefore) to = to + 1;
                  const next = uiOrder.slice();
                  // remove source first
                  next.splice(from, 1);
                  // insert at new index (clamp)
                  const idx = Math.max(0, Math.min(next.length, to));
                  next.splice(idx, 0, dragged);
                  try {
                    reorderCachedFiles(next);
                    try { localStorage.setItem("tn-tab-order", JSON.stringify(next)); } catch {}
                  } catch {}
                  setDraggingKey(null);
                  setDragOverKey(null);
                  setDragInsertBefore(true);
                  window.dispatchEvent(new CustomEvent("tn-tab-drop", { detail: { from: dragged, to: k, insertBefore: dragInsertBefore } }));
                }}
                className={`px-3 py-1 text-sm border border-tn-border rounded flex items-center gap-2 ${draggingKey === k ? "opacity-60" : "bg-tn-panel-darker"}`}
              >
                <button className="truncate max-w-[180px] text-left" onClick={() => { restoreFromCache(k); setCurrentFile(k); }}>{k.split(/[/\\]/).pop()}</button>
                <button title="Close" className="text-xs text-tn-text-muted" onClick={() => removeCachedFile(k)}>×</button>
              </div>

              {/* placeholder after if dragging and insert-before false for this key */}
              {dragOverKey === k && !dragInsertBefore ? (
                <div className="w-1 h-6 bg-tn-accent/60 ml-2 rounded" />
              ) : null}
            </div>
          ))}
        </div>

        <MenuDropdown label="File">
          <MenuItem label="New Project..." onClick={onNewProject} shortcut={resolveKeybinding("newProject")} />
          <MenuItem label="Close Project" onClick={onCloseProject} shortcut={resolveKeybinding("closeProject")} />
          <MenuSeparator />
          <MenuItem label="Open Asset Pack..." onClick={openAssetPack} shortcut={resolveKeybinding("openFile")} />
          <MenuItem label="Save" onClick={saveFile} shortcut={resolveKeybinding("save")} />
          <MenuItem label="Save As..." onClick={saveFileAs} shortcut={resolveKeybinding("saveAs")} />
          <MenuSeparator />
          <MenuItem label="Export Asset Pack..." onClick={exportAssetPack} shortcut={resolveKeybinding("exportPack")} />
          <MenuItem label="Export Current JSON..." onClick={exportCurrentJson} shortcut={resolveKeybinding("exportJson")} />
          <MenuItem label="Export SVG..." onClick={onExportSvg} shortcut={resolveKeybinding("exportSvg")} />
        </MenuDropdown>

        <MenuDropdown label="Edit">
          <MenuItem label="Undo" onClick={undo} shortcut={resolveKeybinding("undo")} />
          <MenuItem label="Redo" onClick={redo} shortcut={resolveKeybinding("redo")} />
          <MenuSeparator />
          <MenuItem
            label="Cut"
            onClick={() => {
              const store = useEditorStore.getState();
              store.copyNodes();
              const ids = store.nodes.filter((n) => n.selected).map((n) => n.id);
              if (ids.length > 0) store.removeNodes(ids);
            }}
            shortcut={resolveKeybinding("cut")}
          />
          <MenuItem label="Copy" onClick={() => useEditorStore.getState().copyNodes()} shortcut={resolveKeybinding("copy")} />
          <MenuItem label="Paste" onClick={() => useEditorStore.getState().pasteNodes()} shortcut={resolveKeybinding("paste")} />
          <MenuItem label="Duplicate" onClick={() => useEditorStore.getState().duplicateNodes()} shortcut={resolveKeybinding("duplicate")} />
          <MenuSeparator />
          <MenuItem
            label="Align Left"
            onClick={() => useEditorStore.getState().alignNodes("left")}
            disabled={selectedCount < 2}
          />
          <MenuItem
            label="Align Right"
            onClick={() => useEditorStore.getState().alignNodes("right")}
            disabled={selectedCount < 2}
          />
          <MenuItem
            label="Align Top"
            onClick={() => useEditorStore.getState().alignNodes("top")}
            disabled={selectedCount < 2}
          />
          <MenuItem
            label="Align Bottom"
            onClick={() => useEditorStore.getState().alignNodes("bottom")}
            disabled={selectedCount < 2}
          />
          <MenuItem
            label="Center Horizontally"
            onClick={() => useEditorStore.getState().alignNodes("centerH")}
            disabled={selectedCount < 2}
          />
          <MenuItem
            label="Center Vertically"
            onClick={() => useEditorStore.getState().alignNodes("centerV")}
            disabled={selectedCount < 2}
          />
          <MenuSeparator />
          <MenuItem
            label="Distribute Horizontal"
            onClick={() => useEditorStore.getState().distributeNodes("horizontal")}
            disabled={selectedCount < 3}
          />
          <MenuItem
            label="Distribute Vertical"
            onClick={() => useEditorStore.getState().distributeNodes("vertical")}
            disabled={selectedCount < 3}
          />
        </MenuDropdown>

        <MenuDropdown label="View">
          <MenuItem label="Reset Zoom" onClick={handleResetZoom} shortcut={resolveKeybinding("resetZoom")} />
          <MenuItem label="Fit View" onClick={handleFitView} shortcut={resolveKeybinding("fitView")} />
          <MenuItem label="Zoom to Selection" onClick={handleZoomToSelection} shortcut={resolveKeybinding("zoomToSelection")} />
          <MenuSeparator />
          <MenuItem
            label={showGrid ? "Hide Grid" : "Show Grid"}
            onClick={() => useUIStore.getState().toggleGrid()}
            shortcut={resolveKeybinding("toggleGrid")}
          />
          <MenuItem
            label={snapToGrid ? "Disable Snap" : "Enable Snap"}
            onClick={() => useUIStore.getState().toggleSnap()}
            shortcut={resolveKeybinding("toggleSnap")}
          />
          <MenuItem
            label={showMinimap ? "Hide Minimap" : "Show Minimap"}
            onClick={() => useUIStore.getState().toggleMinimap()}
          />
          <MenuSeparator />
          <MenuItem
            label={leftPanelVisible ? "Hide Left Panel" : "Show Left Panel"}
            onClick={() => useUIStore.getState().toggleLeftPanel()}
            shortcut={resolveKeybinding("toggleLeftPanel")}
          />
          <MenuItem
            label={rightPanelVisible ? "Hide Right Panel" : "Show Right Panel"}
            onClick={() => useUIStore.getState().toggleRightPanel()}
            shortcut={resolveKeybinding("toggleRightPanel")}
          />
          <MenuItem
            label="Maximize Editor"
            onClick={() => {
              const ui = useUIStore.getState();
              const bothHidden = !ui.leftPanelVisible && !ui.rightPanelVisible;
              ui.setLeftPanelVisible(bothHidden);
              ui.setRightPanelVisible(bothHidden);
            }}
            shortcut={resolveKeybinding("maximizeEditor")}
          />
          <MenuSeparator />
          <MenuItem
            label="Cycle View Mode"
            onClick={() => {
              const { viewMode, setViewMode } = usePreviewStore.getState();
              const cycle: ViewMode[] = ["graph", "preview", "split"];
              setViewMode(cycle[(cycle.indexOf(viewMode) + 1) % cycle.length]);
            }}
            shortcut={resolveKeybinding("cycleViewMode")}
          />
          <MenuItem
            label={showInlinePreviews ? "Hide Inline Previews" : "Show Inline Previews"}
            onClick={() => usePreviewStore.getState().setShowInlinePreviews(!showInlinePreviews)}
            shortcut={resolveKeybinding("togglePreviews")}
          />
          <MenuSeparator />
          <MenuItem
            label="Bridge..."
            onClick={() => useBridgeStore.getState().setDialogOpen(true)}
            shortcut={resolveKeybinding("bridge")}
          />
        </MenuDropdown>

        <MenuDropdown label="Settings">
          <MenuItem label="Preferences..." onClick={onSettings} shortcut={resolveKeybinding("settings")} />
          <MenuItem label="Keyboard Shortcuts..." onClick={onShortcuts} />
          <MenuItem label="Configuration..." onClick={onConfig} />
          <MenuSeparator />
          <MenuItem
            label={flowDirection === "LR" ? "Flow Direction: LTR" : "Flow Direction: RTL"}
            onClick={() => useSettingsStore.getState().setFlowDirection(flowDirection === "LR" ? "RL" : "LR")}
          />
          <MenuSeparator />
          <MenuItem
            label={helpMode ? "Disable Help Mode" : "Enable Help Mode"}
            onClick={() => useUIStore.getState().toggleHelpMode()}
            shortcut={resolveKeybinding("toggleHelpMode")}
          />
          <MenuSeparator />
          <MenuItem
            label={useAccordionSidebar ? "Sidebar: Accordion" : "Sidebar: Tabs"}
            onClick={() => useUIStore.getState().toggleAccordionSidebar()}
          />
        </MenuDropdown>

        <MenuDropdown label="Window">
          <MenuItem
            label="Workspace Layout..."
            onClick={() => useUIStore.getState().setSettingsOpen(true)}
          />
          <MenuItem
            label="Reset Workspace"
            onClick={() => {
              setDockAssignment("toolbar", "toolbar-zone");
              setDockAssignment("left-sidebar", "left-dock");
              useUIStore.getState().setFloatingPreviewPanel(false);
              useUIStore.getState().setFloatingComparisonView(false);
              useUIStore.getState().setFloatingViewModeOverlay(false);
              useUIStore.getState().setFloatingEditorCanvas(false);
            }}
          />
          <MenuSeparator />
          <MenuItem
            label="Toolbar"
            checked={toolbarDocked}
            onClick={() => setDockAssignment("toolbar", toolbarDocked ? null : "toolbar-zone")}
          />
          <MenuItem
            label="Left Sidebar"
            checked={leftPanelVisible}
            onClick={() => useUIStore.getState().toggleLeftPanel()}
          />
          <MenuItem
            label="Properties"
            checked={rightPanelVisible}
            onClick={() => useUIStore.getState().toggleRightPanel()}
          />
          <MenuSeparator />
          <MenuItem
            label="Preview Panel (Floating)"
            checked={floatingPreviewPanel}
            onClick={() => useUIStore.getState().setFloatingPreviewPanel(!floatingPreviewPanel)}
          />
          <MenuItem
            label="Comparison Panel (Floating)"
            checked={floatingComparisonView}
            onClick={() => useUIStore.getState().setFloatingComparisonView(!floatingComparisonView)}
          />
          <MenuItem
            label="View Mode Controls (Floating)"
            checked={floatingViewModeOverlay}
            onClick={() => useUIStore.getState().setFloatingViewModeOverlay(!floatingViewModeOverlay)}
          />
          <MenuItem
            label="Editor Canvas (Floating)"
            checked={false}
            disabled={true}
            onClick={() => { /* disabled */ }}
          />
        </MenuDropdown>
      </div>

      {!isMac && (
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
      )}
    </div>
  );
}
