import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { usePreviewStore, type ViewMode } from "@/stores/previewStore";
import { useUIStore } from "@/stores/uiStore";
import FloatingBox from "@/components/common/FloatingBox";
import DockZone from "@/components/common/DockZone";
import { EditorCanvas } from "./EditorCanvas";
import { BiomeRangeEditor } from "./BiomeRangeEditor";
import { BiomeSectionTabs } from "./BiomeSectionTabs";
import { SettingsEditorView } from "./SettingsEditorView";
import { RawJsonView } from "./RawJsonView";
import { PreviewPanel } from "../preview/PreviewPanel";
import { ComparisonView } from "../preview/ComparisonView";
import { DiagnosticsStrip } from "../preview/DiagnosticsStrip";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "graph", label: "Graph" },
  { key: "preview", label: "Preview" },
  { key: "split", label: "Split" },
  { key: "compare", label: "Compare" },
];

/** View-mode buttons (no positioning) */
const ViewModeButtons = memo(function ViewModeButtons() {
  const viewMode = usePreviewStore((s) => s.viewMode);
  const setViewMode = usePreviewStore((s) => s.setViewMode);
  const splitDirection = usePreviewStore((s) => s.splitDirection);
  const setSplitDirection = usePreviewStore((s) => s.setSplitDirection);

  return (
    <div className="flex items-center gap-0.5 bg-tn-surface/80 backdrop-blur-sm border border-tn-border/60 rounded-lg shadow-lg px-1 py-0.5">
      {VIEW_MODES.map(({ key, label }) => {
        const isActive = key === viewMode;
        return (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              isActive
                ? "bg-tn-accent/20 text-tn-accent"
                : "text-tn-text-muted hover:text-tn-text hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        );
      })}
      {viewMode === "split" && (
        <button
          onClick={() => setSplitDirection(splitDirection === "horizontal" ? "vertical" : "horizontal")}
          className="px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors text-tn-text-muted hover:text-tn-text hover:bg-white/5 ml-0.5 border-l border-tn-border/40 pl-1.5"
          title={`Split: ${splitDirection === "horizontal" ? "Horizontal" : "Vertical"} (V)`}
        >
          {splitDirection === "horizontal" ? "H" : "V"}
        </button>
      )}
    </div>
  );
});

/** Overlay that can either be anchored or floated */
const ViewModeOverlay = memo(function ViewModeOverlay() {
  const floating = useUIStore((s) => s.floatingViewModeOverlay);

  if (floating) {
    return (
      <FloatingBox id="viewmode-overlay" defaultAnchor="top-right">
        <ViewModeButtons />
      </FloatingBox>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-20">
      <ViewModeButtons />
    </div>
  );
});

const SplitView = memo(function SplitView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const splitRatio = usePreviewStore((s) => s.splitRatio);
  const setSplitRatio = usePreviewStore((s) => s.setSplitRatio);
  const splitDirection = usePreviewStore((s) => s.splitDirection);
  const floatingPreview = useUIStore((s) => s.floatingPreviewPanel);
  const detachedPreview = useUIStore((s) => s.previewDetachedWindow);
  const dragging = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isVertical = splitDirection === "vertical";

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    cleanupRef.current?.();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = isVertical
        ? Math.max(0.15, Math.min(0.85, (ev.clientX - rect.left) / rect.width))
        : Math.max(0.15, Math.min(0.85, (ev.clientY - rect.top) / rect.height));
      setSplitRatio(ratio);
    };

    const onMouseUp = () => {
      dragging.current = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };

    cleanupRef.current = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [isVertical, setSplitRatio]);

  if (isVertical) {
    return (
      <div ref={containerRef} className="flex flex-row h-full">
        <div style={{ width: `${splitRatio * 100}%` }} className="min-w-0 overflow-hidden">
          <EditorCanvas />
        </div>
        <div
          className="shrink-0 w-1.5 bg-tn-border hover:bg-tn-accent/50 cursor-col-resize transition-colors"
          onMouseDown={onMouseDown}
        />
        <div style={{ flex: 1 }} className="min-w-0 overflow-hidden">
          {!floatingPreview && !detachedPreview ? <PreviewPanel /> : detachedPreview ? <div className="p-2 text-xs text-tn-text-muted">Preview detached</div> : <div className="p-2 text-xs text-tn-text-muted">Preview floating</div>}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div style={{ height: `${splitRatio * 100}%` }} className="min-h-0 overflow-hidden">
        <EditorCanvas />
      </div>
      <div
        className="shrink-0 h-1.5 bg-tn-border hover:bg-tn-accent/50 cursor-row-resize transition-colors"
        onMouseDown={onMouseDown}
      />
      <div style={{ flex: 1 }} className="min-h-0 overflow-hidden">
        {!floatingPreview && !detachedPreview ? <PreviewPanel /> : detachedPreview ? <div className="p-2 text-xs text-tn-text-muted">Preview detached</div> : <div className="p-2 text-xs text-tn-text-muted">Preview floating</div>}
      </div>
    </div>
  );
});

/** Density-context view: canvas/preview with floating view-mode overlay */
const DensityView = memo(function DensityView() {
  const viewMode = usePreviewStore((s) => s.viewMode);
  const floatingEditor = useUIStore((s) => s.floatingEditorCanvas);
  const floatingPreview = useUIStore((s) => s.floatingPreviewPanel);
  const detachedPreview = useUIStore((s) => s.previewDetachedWindow);
  const floatingComparison = useUIStore((s) => s.floatingComparisonView);

  return (
    <div className="flex flex-col h-full">
      <DiagnosticsStrip />
      <div className="flex-1 min-h-0 relative">
        {/* If editor canvas is floating, render it as a floating box so it can be moved */}
        {floatingEditor && (
          <FloatingBox id="editor-canvas" defaultAnchor="top-left">
            <EditorCanvas />
          </FloatingBox>
        )}
        {/* Panel zone: allows snapping/dropping floating panels similar to Photoshop palettes */}
        <DockZone id="main-dock" className="absolute right-2 top-12 w-64 z-30" />
        {floatingPreview && !detachedPreview && (
          <FloatingBox id="preview-panel" defaultAnchor="top-right">
            <PreviewPanel />
          </FloatingBox>
        )}
        {floatingComparison && (
          <FloatingBox id="comparison-view" defaultAnchor="bottom-right">
            <ComparisonView />
          </FloatingBox>
        )}
        <ViewModeOverlay />
        {viewMode === "graph" && !floatingEditor && (
          <div className="relative h-full">
            <button
              title="Detach canvas"
              className="absolute top-2 left-2 z-30 w-7 h-7 rounded bg-tn-panel-darker flex items-center justify-center text-xs"
              onClick={() => useUIStore.getState().setFloatingEditorCanvas(true)}
            >⇱</button>
            <EditorCanvas />
          </div>
        )}
        {viewMode === "preview" && !floatingPreview && !detachedPreview && <PreviewPanel />}
        {viewMode === "split" && <SplitView />}
        {viewMode === "compare" && !floatingComparison && <ComparisonView />}
      </div>
    </div>
  );
});

export function CenterPanel() {
  const editingContext = useEditorStore((s) => s.editingContext);

  // Read UI flag unconditionally so hook order remains stable across renders
  const floatingEditor = useUIStore((s) => s.floatingEditorCanvas);
  // Stabilize hook ordering by subscribing to preview/UI flags used by child views.
  // These are read here (no-op) so CenterPanel always calls the same hooks in the same order
  // regardless of which branch would have returned early.
  const _viewMode = usePreviewStore((s) => s.viewMode);
  const _splitDirection = usePreviewStore((s) => s.splitDirection);
  const _splitRatio = usePreviewStore((s) => s.splitRatio);
  const _floatingPreview = useUIStore((s) => s.floatingPreviewPanel);
  const _detachedPreview = useUIStore((s) => s.previewDetachedWindow);
  const _floatingComparison = useUIStore((s) => s.floatingComparisonView);

  // Render a single wrapper and conditionally show subviews. This avoids
  // early returns which can accidentally change hook ordering across renders.
  return (
    <div className="relative h-full">
      {editingContext === "NoiseRange" && <NoiseRangeView />}
      {editingContext === "Settings" && <SettingsEditorView />}
      {editingContext === "RawJson" && <RawJsonView />}
      {editingContext === "Biome" && <BiomeView />}

      {/* Density and other node-graph contexts get the view mode tabs */}
      {!editingContext && <DensityView />}

      {/* When not editing a special context and the editor is set to float,
          DensityView will render the floating EditorCanvas; otherwise the
          default EditorCanvas is rendered inside DensityView. */}
    </div>
  );
}

const ROW_H = 28;
const EDITOR_OVERHEAD = 90; // header + coverage strip + column headers
const MIN_EDITOR_H = 160;
const MAX_EDITOR_H = 500;

function defaultEditorHeight(biomeCount: number): number {
  if (biomeCount === 0) return 160;
  // Show ~8–12 rows by default, capped
  const visibleRows = Math.min(biomeCount, 12);
  return Math.max(MIN_EDITOR_H, Math.min(MAX_EDITOR_H, visibleRows * ROW_H + EDITOR_OVERHEAD));
}

/** NoiseRange layout with floating view mode overlay */
const NoiseRangeView = memo(function NoiseRangeView() {
  const viewMode = usePreviewStore((s) => s.viewMode);
  const biomeCount = useEditorStore((s) => s.biomeRanges.length);
  const floatingPreview = useUIStore((s) => s.floatingPreviewPanel);
  const detachedPreview = useUIStore((s) => s.previewDetachedWindow);
  const floatingComparison = useUIStore((s) => s.floatingComparisonView);
  const [manualHeight, setManualHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerCleanupRef = useRef<(() => void) | null>(null);

  const editorHeight = manualHeight ?? defaultEditorHeight(biomeCount);

  useEffect(() => {
    return () => {
      dividerCleanupRef.current?.();
      dividerCleanupRef.current = null;
    };
  }, []);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dividerCleanupRef.current?.();
    const startY = e.clientY;
    const startH = editorHeight;
    const onMouseMove = (ev: MouseEvent) => {
      const maxH = (containerRef.current?.getBoundingClientRect().height ?? 600) * 0.6;
      setManualHeight(Math.max(MIN_EDITOR_H, Math.min(maxH, startH + (ev.clientY - startY))));
    };
    const onMouseUp = () => {
      dividerCleanupRef.current?.();
      dividerCleanupRef.current = null;
    };

    dividerCleanupRef.current = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [editorHeight]);

  return (
    <div className="flex flex-col h-full">
      <DiagnosticsStrip />

      {viewMode === "preview" ? (
        <div className="flex-1 min-h-0 relative">
          {floatingPreview && !detachedPreview && (
            <FloatingBox id="preview-panel" defaultAnchor="top-right">
              <PreviewPanel />
            </FloatingBox>
          )}
          {floatingComparison && (
            <FloatingBox id="comparison-view" defaultAnchor="bottom-right">
              <ComparisonView />
            </FloatingBox>
          )}
          <ViewModeOverlay />
          {!floatingPreview && !detachedPreview && <PreviewPanel />}
        </div>
      ) : viewMode === "split" ? (
        <div ref={containerRef} className="flex-1 min-h-0 flex flex-col relative">
          <ViewModeOverlay />
          <div className="shrink-0" style={{ height: editorHeight }}>
            <BiomeRangeEditor />
          </div>
          <div
            className="shrink-0 h-1 bg-tn-border hover:bg-tn-accent/50 cursor-row-resize transition-colors"
            onMouseDown={onDividerMouseDown}
          />
          <div className="flex-1 min-h-0">
            <SplitView />
          </div>
        </div>
      ) : viewMode === "compare" ? (
        <div className="flex-1 min-h-0 relative">
          {floatingPreview && (
            <FloatingBox id="preview-panel" defaultAnchor="top-right">
              <PreviewPanel />
            </FloatingBox>
          )}
          {floatingComparison && (
            <FloatingBox id="comparison-view" defaultAnchor="bottom-right">
              <ComparisonView />
            </FloatingBox>
          )}
          <ViewModeOverlay />
          {!floatingComparison && <ComparisonView />}
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 min-h-0 flex flex-col relative">
          <ViewModeOverlay />
          <div className="shrink-0" style={{ height: editorHeight }}>
            <BiomeRangeEditor />
          </div>
          <div
            className="shrink-0 h-1 bg-tn-border hover:bg-tn-accent/50 cursor-row-resize transition-colors"
            onMouseDown={onDividerMouseDown}
          />
          <div className="flex-1 min-h-0">
            <EditorCanvas />
          </div>
        </div>
      )}
    </div>
  );
});

/** Biome layout with section tabs header + floating view mode overlay */
const BiomeView = memo(function BiomeView() {
  const viewMode = usePreviewStore((s) => s.viewMode);
  const floatingPreview = useUIStore((s) => s.floatingPreviewPanel);
  const detachedPreview = useUIStore((s) => s.previewDetachedWindow);
  const floatingComparison = useUIStore((s) => s.floatingComparisonView);
  const floatingEditor = useUIStore((s) => s.floatingEditorCanvas);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 bg-tn-surface border-b border-tn-border overflow-x-auto">
        <BiomeSectionTabs />
      </div>
      <DiagnosticsStrip />
      <div className="flex-1 min-h-0 relative">
        {floatingEditor && (
          <FloatingBox id="editor-canvas" defaultAnchor="top-left">
            <EditorCanvas />
          </FloatingBox>
        )}
        {floatingPreview && !detachedPreview && (
          <FloatingBox id="preview-panel" defaultAnchor="top-right">
            <PreviewPanel />
          </FloatingBox>
        )}
        {floatingComparison && (
          <FloatingBox id="comparison-view" defaultAnchor="bottom-right">
            <ComparisonView />
          </FloatingBox>
        )}
        <ViewModeOverlay />
        {viewMode === "graph" && !floatingEditor && <EditorCanvas />}
        {viewMode === "preview" && !floatingPreview && !detachedPreview && <PreviewPanel />}
        {viewMode === "split" && <SplitView />}
        {viewMode === "compare" && !floatingComparison && <ComparisonView />}
      </div>
    </div>
  );
});

