import { useState, useCallback, useRef, useEffect } from "react";
import { AssetTree } from "@/components/sidebar/AssetTree";
import { FileActions } from "@/components/sidebar/FileActions";
import { NodePalette } from "@/components/editor/NodePalette";
import { BookmarkPanel } from "@/components/editor/BookmarkPanel";
import { CenterPanel } from "@/components/editor/CenterPanel";
import { PropertyPanel } from "@/components/properties/PropertyPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { ValidationPanel } from "@/components/editor/ValidationPanel";
import { Toolbar } from "@/components/layout/Toolbar";
import EditorControls from "@/components/editor/EditorControls";
import FloatingBox from "@/components/common/FloatingBox";
import DockZone from "@/components/common/DockZone";
import SceneEnvironmentPanel from "@/components/preview/SceneEnvironmentPanel";
import { useGraphDiagnostics } from "@/hooks/useGraphDiagnostics";
import { useUIStore, type SidebarSectionId } from "@/stores/uiStore";
import { useDiagnosticsStore } from "@/stores/diagnosticsStore";

const MIN_PANEL_WIDTH = 180;
const DEFAULT_LEFT = 240;
const DEFAULT_RIGHT = 320;
const STORAGE_KEY = "terranova-panel-widths";

function loadPersistedWidths(): { left: number; right: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        left: Math.max(MIN_PANEL_WIDTH, parsed.left ?? DEFAULT_LEFT),
        right: Math.max(MIN_PANEL_WIDTH, parsed.right ?? DEFAULT_RIGHT),
      };
    }
  } catch {
    // Ignore corrupted localStorage
  }
  return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT };
}

// ---------------------------------------------------------------------------
// Section configuration
// ---------------------------------------------------------------------------

const SECTION_CONFIG: Record<SidebarSectionId, { title: string; icon: string }> = {
  nodes: { title: "Nodes", icon: "\u25A6" },
  files: { title: "Files", icon: "\u2630" },
  history: { title: "History", icon: "\u21BA" },
  validation: { title: "Issues", icon: "\u26A0" },
  bookmarks: { title: "Bookmarks", icon: "\u2606" },
};

function SectionContent({ id }: { id: SidebarSectionId }) {
  switch (id) {
    case "nodes":
      return <NodePalette />;
    case "files":
      return (
        <>
          <FileActions />
          <AssetTree />
        </>
      );
    case "history":
      return <HistoryPanel />;
    case "validation":
      return <ValidationPanel />;
    case "bookmarks":
      return <BookmarkPanel />;
  }
}

// ---------------------------------------------------------------------------
// Classic tab sidebar (original behavior)
// ---------------------------------------------------------------------------

type LeftTab = "files" | "nodes" | "history" | "validation";

function BookmarkSection() {
  const [collapsed, setCollapsed] = useState(true);
  const bookmarkCount = useUIStore((s) => s.bookmarks.size);

  return (
    <div className="border-t border-tn-border shrink-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-tn-text-muted hover:text-tn-text"
      >
        <span className="text-[9px]">{collapsed ? "\u25B6" : "\u25BC"}</span>
        <span>Bookmarks</span>
        {bookmarkCount > 0 && (
          <span className="ml-auto text-[9px] text-tn-accent">{bookmarkCount}</span>
        )}
      </button>
      {!collapsed && (
        <div className="h-[200px]">
          <BookmarkPanel />
        </div>
      )}
    </div>
  );
}

function TabSidebar() {
  const [leftTab, setLeftTab] = useState<LeftTab>("nodes");

  return (
    <>
      {/* Tab bar */}
      <div className="flex border-b border-tn-border shrink-0">
        <button
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            leftTab === "nodes"
              ? "text-tn-accent border-b-2 border-tn-accent"
              : "text-tn-text-muted hover:text-tn-text"
          }`}
          onClick={() => setLeftTab("nodes")}
        >
          Nodes
        </button>
        <button
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            leftTab === "files"
              ? "text-tn-accent border-b-2 border-tn-accent"
              : "text-tn-text-muted hover:text-tn-text"
          }`}
          onClick={() => setLeftTab("files")}
        >
          Files
        </button>
        <button
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            leftTab === "history"
              ? "text-tn-accent border-b-2 border-tn-accent"
              : "text-tn-text-muted hover:text-tn-text"
          }`}
          onClick={() => setLeftTab("history")}
        >
          History
        </button>
        <button
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            leftTab === "validation"
              ? "text-tn-accent border-b-2 border-tn-accent"
              : "text-tn-text-muted hover:text-tn-text"
          }`}
          onClick={() => setLeftTab("validation")}
        >
          Issues
        </button>
      </div>

      {/* Tab content — both rendered always; inactive hidden via CSS to preserve state */}
      <div className="flex-1 overflow-y-auto">
        <div className={leftTab === "nodes" ? "flex flex-col h-full" : "hidden"}>
          <div className="flex-1 overflow-y-auto">
            <NodePalette />
          </div>
          <BookmarkSection />
        </div>
        <div className={leftTab === "files" ? "" : "hidden"}>
          <FileActions />
          <AssetTree />
        </div>
        <div className={leftTab === "history" ? "h-full" : "hidden"}>
          <HistoryPanel />
        </div>
        <div className={leftTab === "validation" ? "h-full" : "hidden"}>
          <ValidationPanel />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Accordion sidebar
// ---------------------------------------------------------------------------

function AccordionSidebar() {
  const sectionOrder = useUIStore((s) => s.sidebarSectionOrder);
  const expanded = useUIStore((s) => s.sidebarExpanded);
  const toggleSection = useUIStore((s) => s.toggleSection);
  const reorderSections = useUIStore((s) => s.reorderSections);
  const bookmarkCount = useUIStore((s) => s.bookmarks.size);
  const issueCount = useDiagnosticsStore((s) => s.diagnostics.length);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function getBadge(id: SidebarSectionId): React.ReactNode {
    if (id === "bookmarks" && bookmarkCount > 0) {
      return <span className="text-[9px] text-tn-accent">{bookmarkCount}</span>;
    }
    if (id === "validation" && issueCount > 0) {
      return <span className="text-[9px] text-amber-400">{issueCount}</span>;
    }
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sectionOrder.map((id, index) => {
        const config = SECTION_CONFIG[id];
        const isExpanded = expanded[id];
        const isDropTarget = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

        return (
          <div
            key={id}
            className={isDropTarget ? "border-t-2 border-tn-accent" : ""}
          >
            {/* Accordion header */}
            <button
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-tn-text-muted hover:text-tn-text hover:bg-tn-accent/10 border-b border-tn-border shrink-0 select-none"
              onClick={() => toggleSection(id)}
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverIndex(index);
              }}
              onDragLeave={() => {
                setDragOverIndex((prev) => (prev === index ? null : prev));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index) {
                  reorderSections(draggedIndex, index);
                }
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
            >
              <span className="text-[9px] w-3 text-center cursor-grab active:cursor-grabbing opacity-40">{"\u2261"}</span>
              <span className="text-[10px] w-4 text-center">{config.icon}</span>
              <span>{config.title}</span>
              {getBadge(id)}
              <span className="ml-auto text-[9px] opacity-60">{isExpanded ? "\u25BC" : "\u25B6"}</span>
            </button>

            {/* Section content */}
            {isExpanded && (
              <SectionContent id={id} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main layout
// ---------------------------------------------------------------------------

export function PanelLayout() {
  const initial = loadPersistedWidths();
  const [leftWidth, setLeftWidth] = useState(initial.left);
  const [rightWidth, setRightWidth] = useState(initial.right);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftPanelVisible = useUIStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUIStore((s) => s.rightPanelVisible);
  const useAccordion = useUIStore((s) => s.useAccordionSidebar);
  const dockAssignments = useUIStore((s) => s.dockAssignments);
  const setDockAssignment = useUIStore((s) => s.setDockAssignment);

  // Drive diagnostics computation (debounced, pushes to diagnosticsStore)
  useGraphDiagnostics();

  // Ensure toolbar is docked into the toolbar dock zone by default
  useEffect(() => {
    try {
      if (!dockAssignments || !dockAssignments["toolbar"]) {
        setDockAssignment("toolbar", "toolbar-zone");
      }
      if (!dockAssignments || !dockAssignments["left-sidebar"]) {
        setDockAssignment("left-sidebar", "left-dock");
      }
      if (!dockAssignments || !dockAssignments["editor-controls"]) {
        setDockAssignment("editor-controls", "right-dock");
      }
    } catch {}
  }, []);

  // Persist widths to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: leftWidth, right: rightWidth }));
    } catch {
      // Ignore write failures (e.g., storage full)
    }
  }, [leftWidth, rightWidth]);

  const handleDrag = useCallback(
    (side: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = side === "left" ? leftWidth : rightWidth;

      function onMouseMove(ev: MouseEvent) {
        const delta = ev.clientX - startX;
        const newWidth = side === "left" ? startWidth + delta : startWidth - delta;
        const clamped = Math.max(MIN_PANEL_WIDTH, newWidth);
        if (side === "left") setLeftWidth(clamped);
        else setRightWidth(clamped);
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [leftWidth, rightWidth],
  );

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Floating toolbar (will portal into toolbar-zone when docked) */}
      <FloatingBox id="toolbar" defaultAnchor="top-left">
        <Toolbar />
      </FloatingBox>
      {/* Floating left sidebar: allows undocking the whole left panel */}
      <FloatingBox id="left-sidebar" defaultAnchor="top-left">
        {useAccordion ? <AccordionSidebar /> : <TabSidebar />}
      </FloatingBox>
      {/* Floating editor controls (dockable into right-dock) */}
      <FloatingBox id="editor-controls" defaultAnchor="bottom-right">
        <EditorControls />
      </FloatingBox>
      {/* Left sidebar */}
      {leftPanelVisible && (
        <>
          <div
            className="flex flex-col bg-tn-surface border-r border-tn-border shrink-0 transition-all duration-150"
            style={{ width: leftWidth }}
          >
            {/* Dock zone for left sidebar: left-sidebar FloatingBox will portal here when docked */}
            <DockZone id="left-dock" className="h-full" />
          </div>

          {/* Left drag handle */}
          <div
            className="w-1 cursor-col-resize hover:bg-tn-accent/30 active:bg-tn-accent/50 shrink-0"
            onMouseDown={handleDrag("left")}
          />
        </>
      )}

      {/* Center: editor canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Dock zone for toolbar: FloatingBox will portal here when docked */}
        <div className="shrink-0">
          <DockZone id="toolbar-zone" className="w-full" />
        </div>
        <CenterPanel />
      </div>

      {/* Right panel */}
      {rightPanelVisible && (
        <>
          {/* Right drag handle */}
          <div
            className="w-1 cursor-col-resize hover:bg-tn-accent/30 active:bg-tn-accent/50 shrink-0"
            onMouseDown={handleDrag("right")}
          />

          {/* Right panel: properties */}
          <div
            className="flex flex-col bg-tn-surface border-l border-tn-border overflow-y-auto shrink-0 transition-all duration-150"
            style={{ width: rightWidth }}
          >
            {/* Dock zone for editor controls (will host editor-controls when docked) */}
            <DockZone id="right-dock" className="px-2 py-2" />
            <PropertyPanel />
            {/* Scene environment properties */}
            <SceneEnvironmentPanel />
          </div>
        </>
      )}
    </div>
  );
}
