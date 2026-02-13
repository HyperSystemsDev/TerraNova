import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTauriIO } from "@/hooks/useTauriIO";
import { useEditorStore } from "@/stores/editorStore";
import { usePreviewStore, type ViewMode } from "@/stores/previewStore";
import { useBridgeStore } from "@/stores/bridgeStore";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { NewProjectDialog } from "@/components/dialogs/NewProjectDialog";
import { BridgeDialog } from "@/components/dialogs/BridgeDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { KeyboardShortcutsDialog } from "@/components/dialogs/KeyboardShortcutsDialog";
import { useToastStore } from "@/stores/toastStore";
import { saveRef } from "@/utils/saveRef";
import { matchesKeybinding, resolveKeybinding } from "@/config/keybindings";
import { exportAssetPack, exportCurrentJson } from "@/utils/exportAssetPack";

interface MenuItemProps {
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
}

function MenuItem({ label, onClick, shortcut, disabled }: MenuItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-1.5 text-sm flex justify-between gap-6 ${
        disabled ? "text-tn-text-muted/40 cursor-default" : "hover:bg-tn-accent/20"
      }`}
      onClick={() => { if (!disabled) onClick(); }}
      disabled={disabled}
    >
      <span>{label}</span>
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
        className="px-3 py-1 text-sm hover:bg-tn-surface rounded"
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

interface ToolbarProps {
  onCloseProject: () => void;
}

export function Toolbar({ onCloseProject }: ToolbarProps) {
  const { openAssetPack, saveFile, saveFileAs } = useTauriIO();
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const reactFlow = useReactFlow();
  const showInlinePreviews = usePreviewStore((s) => s.showInlinePreviews);
  const showGrid = useUIStore((s) => s.showGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const showMinimap = useUIStore((s) => s.showMinimap);
  const leftPanelVisible = useUIStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUIStore((s) => s.rightPanelVisible);
  const helpMode = useUIStore((s) => s.helpMode);
  const flowDirection = useSettingsStore((s) => s.flowDirection);

  // Register saveRef so App.tsx can call saveFile from outside ReactFlowProvider
  useEffect(() => {
    saveRef.current = saveFile;
    return () => { saveRef.current = null; };
  }, [saveFile]);

  // Get selected count for enable/disable logic — use reduce instead of filter to avoid allocating
  const selectedCount = useEditorStore(
    useCallback((s: { nodes: { selected?: boolean }[] }) => s.nodes.reduce((count, n) => count + (n.selected ? 1 : 0), 0), []),
  );

  async function handleAutoLayout() {
    const { nodes, edges, setNodes, commitState } = useEditorStore.getState();
    if (nodes.length === 0) return;
    try {
      const { autoLayout } = await import("@/utils/autoLayout");
      const layouted = await autoLayout(nodes, edges, useSettingsStore.getState().flowDirection);
      setNodes(layouted);
      commitState("Auto layout");
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.1, duration: 300 });
      }, 50);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Auto layout failed:", err);
      useToastStore.getState().addToast("Auto layout failed", "error");
    }
  }

  async function handleAutoLayoutSelected() {
    const { nodes, edges, setNodes, commitState } = useEditorStore.getState();
    const selectedIds = new Set(
      nodes.filter((n) => n.selected).map((n) => n.id),
    );
    if (selectedIds.size < 2) return;
    try {
      const { autoLayoutSelected } = await import("@/utils/autoLayout");
      const layouted = await autoLayoutSelected(nodes, edges, selectedIds, useSettingsStore.getState().flowDirection);
      setNodes(layouted);
      commitState("Auto layout selected");
    } catch (err) {
      if (import.meta.env.DEV) console.error("Auto layout failed:", err);
      useToastStore.getState().addToast("Auto layout failed", "error");
    }
  }

  async function handleTidyUp() {
    const { nodes, setNodes, commitState } = useEditorStore.getState();
    if (nodes.length === 0) return;
    const { tidyUp } = await import("@/utils/autoLayout");
    const gridSize = useUIStore.getState().gridSize;
    const tidied = tidyUp(nodes, gridSize);
    setNodes(tidied);
    commitState("Tidy up");
  }

  function handleResetZoom() {
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

  // Wire global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Alt+1-9 — jump to bookmark (parameterized, stays hardcoded)
      if (e.altKey && !mod && !e.shiftKey && /^[1-9]$/.test(e.key) && !inInput) {
        const slot = parseInt(e.key);
        const bookmark = useUIStore.getState().bookmarks.get(slot);
        if (bookmark) {
          e.preventDefault();
          reactFlow.setViewport(
            { x: bookmark.x, y: bookmark.y, zoom: bookmark.zoom },
            { duration: 300 },
          );
        }
        return;
      }

      // Ctrl+Shift+1-9 — save bookmark at current viewport (parameterized, stays hardcoded)
      if (mod && e.shiftKey && /^[1-9!@#$%^&*(]$/.test(e.key) && !inInput) {
        const shiftDigitMap: Record<string, number> = {
          "!": 1, "@": 2, "#": 3, "$": 4, "%": 5, "^": 6, "&": 7, "*": 8, "(": 9,
          "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        };
        const slot = shiftDigitMap[e.key];
        if (slot) {
          e.preventDefault();
          const viewport = reactFlow.getViewport();
          useUIStore.getState().setBookmark(slot, {
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom,
          });
          return;
        }
      }

      if (inInput) return;

      // Toggle grid
      if (matchesKeybinding("toggleGrid", e)) {
        e.preventDefault();
        useUIStore.getState().toggleGrid();
        return;
      }

      // Toggle snap
      if (matchesKeybinding("toggleSnap", e)) {
        e.preventDefault();
        useUIStore.getState().toggleSnap();
        return;
      }

      // Cycle view mode
      if (matchesKeybinding("cycleViewMode", e)) {
        const editingContext = useEditorStore.getState().editingContext;
        if (!editingContext || editingContext === "Settings") return;
        e.preventDefault();
        const { viewMode, setViewMode } = usePreviewStore.getState();
        const cycle: ViewMode[] = ["graph", "preview", "split"];
        setViewMode(cycle[(cycle.indexOf(viewMode) + 1) % cycle.length]);
        return;
      }

      // Toggle help mode
      if (matchesKeybinding("toggleHelpMode", e)) {
        e.preventDefault();
        useUIStore.getState().toggleHelpMode();
        return;
      }

      // Auto layout all
      if (matchesKeybinding("autoLayoutAll", e)) {
        e.preventDefault();
        handleAutoLayout();
        return;
      }

      // Auto layout selected
      if (matchesKeybinding("autoLayoutSelected", e)) {
        e.preventDefault();
        handleAutoLayoutSelected();
        return;
      }

      // Toggle inline previews
      if (matchesKeybinding("togglePreviews", e)) {
        const editingContext = useEditorStore.getState().editingContext;
        if (!editingContext || editingContext === "Settings") return;
        e.preventDefault();
        const store = usePreviewStore.getState();
        store.setShowInlinePreviews(!store.showInlinePreviews);
        return;
      }

      // Tidy up
      if (matchesKeybinding("tidyUp", e)) {
        e.preventDefault();
        handleTidyUp();
        return;
      }

      // New project
      if (matchesKeybinding("newProject", e)) {
        e.preventDefault();
        setShowNewProject(true);
        return;
      }

      // Close project
      if (matchesKeybinding("closeProject", e)) {
        e.preventDefault();
        onCloseProject();
        return;
      }

      // Open file
      if (matchesKeybinding("openFile", e)) {
        e.preventDefault();
        openAssetPack();
        return;
      }

      // Export asset pack (check before exportJson to avoid Ctrl+E matching Ctrl+Shift+E)
      if (matchesKeybinding("exportPack", e)) {
        e.preventDefault();
        exportAssetPack();
        return;
      }

      // Export current JSON
      if (matchesKeybinding("exportJson", e)) {
        e.preventDefault();
        exportCurrentJson();
        return;
      }

      // Save as
      if (matchesKeybinding("saveAs", e)) {
        e.preventDefault();
        saveFileAs();
        return;
      }

      // Save (check after saveAs to avoid Ctrl+Shift+S matching Ctrl+S)
      if (matchesKeybinding("save", e)) {
        e.preventDefault();
        saveFile();
        return;
      }

      // Redo
      if (matchesKeybinding("redo", e)) {
        e.preventDefault();
        redo();
        return;
      }

      // Undo (check after redo to avoid Ctrl+Shift+Z matching Ctrl+Z)
      if (matchesKeybinding("undo", e)) {
        e.preventDefault();
        undo();
        return;
      }

      // Bridge
      if (matchesKeybinding("bridge", e)) {
        e.preventDefault();
        useBridgeStore.getState().setDialogOpen(true);
        return;
      }

      // Settings
      if (matchesKeybinding("settings", e)) {
        e.preventDefault();
        setShowSettings(true);
        return;
      }

      // Toggle left panel
      if (matchesKeybinding("toggleLeftPanel", e)) {
        e.preventDefault();
        useUIStore.getState().toggleLeftPanel();
        return;
      }

      // Toggle right panel
      if (matchesKeybinding("toggleRightPanel", e)) {
        e.preventDefault();
        useUIStore.getState().toggleRightPanel();
        return;
      }

      // Maximize editor
      if (matchesKeybinding("maximizeEditor", e)) {
        e.preventDefault();
        const ui = useUIStore.getState();
        const bothHidden = !ui.leftPanelVisible && !ui.rightPanelVisible;
        ui.setLeftPanelVisible(bothHidden);
        ui.setRightPanelVisible(bothHidden);
        return;
      }

      // Reset zoom
      if (matchesKeybinding("resetZoom", e)) {
        e.preventDefault();
        handleResetZoom();
        return;
      }

      // Fit view
      if (matchesKeybinding("fitView", e)) {
        e.preventDefault();
        handleFitView();
        return;
      }

      // Zoom to selection
      if (matchesKeybinding("zoomToSelection", e)) {
        e.preventDefault();
        handleZoomToSelection();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openAssetPack, saveFile, saveFileAs, undo, redo]);

  return (
    <>
      <div className="flex items-center h-10 px-2 bg-tn-surface border-b border-tn-border shrink-0">
        <MenuDropdown label="File">
          <MenuItem label="New Project..." onClick={() => setShowNewProject(true)} shortcut={resolveKeybinding("newProject")} />
          <MenuItem label="Close Project" onClick={onCloseProject} shortcut={resolveKeybinding("closeProject")} />
          <MenuSeparator />
          <MenuItem label="Open Asset Pack..." onClick={openAssetPack} shortcut={resolveKeybinding("openFile")} />
          <MenuItem label="Save" onClick={saveFile} shortcut={resolveKeybinding("save")} />
          <MenuItem label="Save As..." onClick={saveFileAs} shortcut={resolveKeybinding("saveAs")} />
          <MenuSeparator />
          <MenuItem label="Export Asset Pack..." onClick={exportAssetPack} shortcut={resolveKeybinding("exportPack")} />
          <MenuItem label="Export Current JSON..." onClick={exportCurrentJson} shortcut={resolveKeybinding("exportJson")} />
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
          <MenuSeparator />
          <MenuItem label="Auto Layout All" onClick={handleAutoLayout} />
          <MenuItem label="Auto Layout Selected" onClick={handleAutoLayoutSelected} />
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
          <MenuItem label="Cycle View Mode" onClick={() => {
            const { viewMode, setViewMode } = usePreviewStore.getState();
            const cycle: ViewMode[] = ["graph", "preview", "split"];
            setViewMode(cycle[(cycle.indexOf(viewMode) + 1) % cycle.length]);
          }} shortcut={resolveKeybinding("cycleViewMode")} />
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
          <MenuItem
            label="Preferences..."
            onClick={() => setShowSettings(true)}
            shortcut={resolveKeybinding("settings")}
          />
          <MenuItem
            label="Keyboard Shortcuts..."
            onClick={() => setShowShortcuts(true)}
          />
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
        </MenuDropdown>

        <div className="w-3" />
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 text-[11px] hover:bg-tn-surface rounded text-tn-text-muted"
            onClick={handleAutoLayout}
            title="Auto Layout All (L)"
          >
            ⊞ Layout All
          </button>
          <button
            className={`px-2 py-1 text-[11px] rounded ${
              selectedCount < 2
                ? "text-tn-text-muted/40 cursor-default"
                : "hover:bg-tn-surface text-tn-text-muted"
            }`}
            onClick={handleAutoLayoutSelected}
            disabled={selectedCount < 2}
            title="Auto Layout Selected (Shift+L)"
          >
            ⊞ Layout Selected
          </button>
          <button
            className="px-2 py-1 text-[11px] hover:bg-tn-surface rounded text-tn-text-muted"
            onClick={handleTidyUp}
            title="Tidy Up (Ctrl+Shift+L)"
          >
            ⊞ Tidy Up
          </button>
        </div>

        <div className="flex-1" />
        <span className="text-sm text-tn-text-muted font-medium">TerraNova</span>
        <div className="w-2" />
      </div>

      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <BridgeDialog />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
