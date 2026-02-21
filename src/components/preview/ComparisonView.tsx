import { useCallback, useMemo, useRef } from "react";
import { usePreviewStore, type PreviewMode } from "@/stores/previewStore";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
import { useComparisonEvaluation } from "@/hooks/useComparisonEvaluation";
import { Preview3D } from "./Preview3D";
import { COLORMAPS } from "@/utils/colormaps";
import { getColormap } from "@/utils/colormaps";

function ComparePane({
  label,
  nodeId,
  setNodeId,
  paneMode,
  setPaneMode,
  values,
  minValue,
  maxValue,
  isLoading,
}: {
  label: string;
  nodeId: string | null;
  setNodeId: (id: string | null) => void;
  paneMode: PreviewMode;
  setPaneMode: (mode: PreviewMode) => void;
  values: Float32Array | null;
  minValue: number;
  maxValue: number;
  isLoading: boolean;
}) {
  const nodes = useEditorStore((s) => s.nodes);
  const colormap = usePreviewStore((s) => s.colormap);
  const resolution = usePreviewStore((s) => s.resolution);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handle3DCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
  }, []);

  // Density nodes (those that could produce output)
  const densityNodes = useMemo(() => nodes, [nodes]);

  return (
    <div className="flex-1 min-w-0 flex flex-col border-r border-tn-border last:border-r-0 overflow-hidden">
      {/* Pane header */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-1.5 bg-tn-surface border-b border-tn-border">
        <span className="text-[10px] font-bold text-tn-accent">{label}</span>

        {/* Node selector */}
        <select
          value={nodeId ?? "__none__"}
          onChange={(e) => setNodeId(e.target.value === "__none__" ? null : e.target.value)}
          className="flex-1 min-w-0 bg-tn-panel border border-tn-border rounded px-1.5 py-0.5 text-[10px] text-tn-text truncate"
        >
          <option value="__none__">Select node...</option>
          {densityNodes.map((n) => {
            const data = n.data as Record<string, unknown>;
            const typeName = (data?.type as string) ?? n.type ?? "Node";
            return (
              <option key={n.id} value={n.id}>
                {typeName} ({n.id})
              </option>
            );
          })}
        </select>

        {/* 2D/3D/Voxel toggle */}
        <button
          onClick={() => {
            const modes: ("2d" | "3d" | "voxel")[] = ["2d", "3d", "voxel"];
            const idx = modes.indexOf(paneMode as any);
            setPaneMode(modes[(idx + 1) % modes.length]);
          }}
          className="px-1.5 py-0.5 text-[9px] rounded bg-tn-panel text-tn-text-muted hover:text-tn-text border border-tn-border"
        >
          {paneMode === "2d" ? "2D" : paneMode === "3d" ? "3D" : "Voxel"}
        </button>

        {isLoading && (
          <span className="inline-block w-2.5 h-2.5 border-2 border-tn-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 relative">
        {!nodeId && (
          <div className="flex items-center justify-center h-full text-[11px] text-tn-text-muted">
            Select a node to preview
          </div>
        )}

        {nodeId && !values && !isLoading && (
          <div className="flex items-center justify-center h-full text-[11px] text-tn-text-muted">
            No data
          </div>
        )}

        {nodeId && values && (
          <ComparePreview
            mode={paneMode}
            values={values}
            minValue={minValue}
            maxValue={maxValue}
            resolution={resolution}
            colormap={colormap}
            canvasRef={canvasRef}
            handle3DCanvasRef={handle3DCanvasRef}
          />
        )}
      </div>
    </div>
  );
}

function ComparePreview({
  mode,
  values,
  minValue,
  maxValue,
  resolution,
  colormap,
  canvasRef,
  handle3DCanvasRef,
}: {
  mode: PreviewMode;
  values: Float32Array;
  minValue: number;
  maxValue: number;
  resolution: number;
  colormap: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handle3DCanvasRef: (el: HTMLCanvasElement | null) => void;
}) {
  // For comparison panes, we render using the store values
  // The store already has the main values set, but comparison uses its own values
  // We render using the Heatmap2D/Preview3D which read from the store.
  // For simplicity, each comparison pane renders a mini canvas directly.
  const cm = getColormap(colormap as any);

  if (mode === "3d") {
    return <Preview3D onCanvasRef={handle3DCanvasRef} />;
  }

  // Simple inline 2D heatmap for comparison pane
  return (
    <div className="relative flex items-center justify-center h-full p-2">
      <canvas
        ref={(el) => {
          if (canvasRef && "current" in canvasRef) {
            (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
          }
          if (!el) return;
          const n = resolution;
          el.width = n;
          el.height = n;
          const ctx = el.getContext("2d");
          if (!ctx) return;

          const imageData = ctx.createImageData(n, n);
          const isFlat = maxValue === minValue;
          const range = maxValue - minValue || 1;

          for (let i = 0; i < values.length; i++) {
            const normalized = isFlat ? 0.5 : (values[i] - minValue) / range;
            const [r, g, b] = cm.ramp(normalized);
            const pixel = i * 4;
            imageData.data[pixel] = r;
            imageData.data[pixel + 1] = g;
            imageData.data[pixel + 2] = b;
            imageData.data[pixel + 3] = 255;
          }

          ctx.putImageData(imageData, 0, 0);
        }}
        className="border border-tn-border"
        style={{
          imageRendering: "pixelated",
          aspectRatio: "1 / 1",
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "100%",
        }}
      />
      {/* Min/Max legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-0.5 text-[9px] text-tn-text-muted font-mono">
        <span>min: {minValue.toFixed(3)}</span>
        <span>max: {maxValue.toFixed(3)}</span>
      </div>
    </div>
  );
}

export function ComparisonView() {
  useComparisonEvaluation();

  const compareNodeA = usePreviewStore((s) => s.compareNodeA);
  const compareNodeB = usePreviewStore((s) => s.compareNodeB);
  const setCompareNodeA = usePreviewStore((s) => s.setCompareNodeA);
  const setCompareNodeB = usePreviewStore((s) => s.setCompareNodeB);
  const compareModeA = usePreviewStore((s) => s.compareModeA);
  const compareModeB = usePreviewStore((s) => s.compareModeB);
  const setCompareModeA = usePreviewStore((s) => s.setCompareModeA);
  const setCompareModeB = usePreviewStore((s) => s.setCompareModeB);
  const compareValuesA = usePreviewStore((s) => s.compareValuesA);
  const compareValuesB = usePreviewStore((s) => s.compareValuesB);
  const compareMinA = usePreviewStore((s) => s.compareMinA);
  const compareMaxA = usePreviewStore((s) => s.compareMaxA);
  const compareMinB = usePreviewStore((s) => s.compareMinB);
  const compareMaxB = usePreviewStore((s) => s.compareMaxB);
  const compareLoadingA = usePreviewStore((s) => s.compareLoadingA);
  const compareLoadingB = usePreviewStore((s) => s.compareLoadingB);
  const linkCameras3D = usePreviewStore((s) => s.linkCameras3D);
  const setLinkCameras3D = usePreviewStore((s) => s.setLinkCameras3D);

  const colormap = usePreviewStore((s) => s.colormap);
  const setColormap = usePreviewStore((s) => s.setColormap);
  const resolution = usePreviewStore((s) => s.resolution);
  const setResolution = usePreviewStore((s) => s.setResolution);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-tn-bg">
      {/* Shared top bar */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-1.5 bg-tn-surface border-b border-tn-border">
        <span className="text-[10px] text-tn-text-muted font-medium">Compare</span>

        <div className="flex items-center gap-1">
          <label className="text-[10px] text-tn-text-muted">Colormap:</label>
          <select
            value={colormap}
            onChange={(e) => setColormap(e.target.value as typeof colormap)}
            className="bg-tn-panel border border-tn-border rounded px-1.5 py-0.5 text-[10px] text-tn-text"
          >
            {COLORMAPS.map((cm) => (
              <option key={cm.id} value={cm.id}>{cm.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label className="text-[10px] text-tn-text-muted">Res:</label>
          <input
            type="number"
            value={resolution}
            min={16}
            max={512}
            step={16}
            onChange={(e) => setResolution(parseInt(e.target.value) || 128)}
            className="w-14 px-1 py-0.5 text-[10px] bg-tn-panel border border-tn-border rounded text-right text-tn-text"
          />
        </div>

        <label className="flex items-center gap-1 text-[10px] text-tn-text-muted cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={linkCameras3D}
            onChange={(e) => setLinkCameras3D(e.target.checked)}
            className="accent-tn-accent w-3 h-3"
          />
          Link 3D Cameras
        </label>
        <button
          title="Detach comparison"
          className="ml-2 w-7 h-7 rounded bg-tn-panel-darker flex items-center justify-center text-xs"
          onClick={() => useUIStore.getState().setFloatingComparisonView(true)}
        >⇱</button>
      </div>

      {/* Side-by-side panes */}
      <div className="flex-1 min-h-0 flex">
        <ComparePane
          label="A"
          nodeId={compareNodeA}
          setNodeId={setCompareNodeA}
          paneMode={compareModeA}
          setPaneMode={setCompareModeA}
          values={compareValuesA}
          minValue={compareMinA}
          maxValue={compareMaxA}
          isLoading={compareLoadingA}
        />
        <ComparePane
          label="B"
          nodeId={compareNodeB}
          setNodeId={setCompareNodeB}
          paneMode={compareModeB}
          setPaneMode={setCompareModeB}
          values={compareValuesB}
          minValue={compareMinB}
          maxValue={compareMaxB}
          isLoading={compareLoadingB}
        />
      </div>
    </div>
  );
}
