import { useState, useCallback, useRef, useEffect } from "react";
import { AssetTree } from "@/components/sidebar/AssetTree";
import { FileActions } from "@/components/sidebar/FileActions";
import { NodePalette } from "@/components/editor/NodePalette";
import { BookmarkPanel } from "@/components/editor/BookmarkPanel";
import { CenterPanel } from "@/components/editor/CenterPanel";
import { PropertyPanel } from "@/components/properties/PropertyPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { ValidationPanel } from "@/components/editor/ValidationPanel";
import { useGraphDiagnostics } from "@/hooks/useGraphDiagnostics";
import { useUIStore } from "@/stores/uiStore";

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

export function PanelLayout() {
  const initial = loadPersistedWidths();
  const [leftWidth, setLeftWidth] = useState(initial.left);
  const [rightWidth, setRightWidth] = useState(initial.right);
  const [leftTab, setLeftTab] = useState<LeftTab>("nodes");
  const containerRef = useRef<HTMLDivElement>(null);

  const leftPanelVisible = useUIStore((s) => s.leftPanelVisible);
  const rightPanelVisible = useUIStore((s) => s.rightPanelVisible);

  // Drive diagnostics computation (debounced, pushes to diagnosticsStore)
  useGraphDiagnostics();

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
      {/* Left sidebar */}
      {leftPanelVisible && (
        <>
          <div
            className="flex flex-col bg-tn-surface border-r border-tn-border shrink-0 transition-all duration-150"
            style={{ width: leftWidth }}
          >
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
          </div>

          {/* Left drag handle */}
          <div
            className="w-1 cursor-col-resize hover:bg-tn-accent/30 active:bg-tn-accent/50 shrink-0"
            onMouseDown={handleDrag("left")}
          />
        </>
      )}

      {/* Center: editor canvas */}
      <div className="flex-1 min-w-0">
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
            <PropertyPanel />
          </div>
        </>
      )}
    </div>
  );
}
