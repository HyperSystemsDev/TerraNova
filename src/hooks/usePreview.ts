import { useEffect, useRef } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useEditorStore } from "@/stores/editorStore";
import { evaluateDensity } from "@/utils/ipc";
import { graphToJson } from "@/utils/graphToJson";

/**
 * Debounced preview evaluation hook.
 * Watches editor graph changes and triggers density evaluation via Tauri.
 */
export function usePreview() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const resolution = usePreviewStore((s) => s.resolution);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const yLevel = usePreviewStore((s) => s.yLevel);
  const selectedPreviewNodeId = usePreviewStore((s) => s.selectedPreviewNodeId);
  const setValues = usePreviewStore((s) => s.setValues);
  const setLoading = usePreviewStore((s) => s.setLoading);
  const setPreviewError = usePreviewStore((s) => s.setPreviewError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (nodes.length === 0) {
        setValues(null, 0, 0);
        setPreviewError(null);
        return;
      }

      const graph = graphToJson(nodes, edges);
      if (!graph) return;

      setLoading(true);
      setPreviewError(null);
      try {
        const response = await evaluateDensity({
          graph,
          resolution,
          range_min: rangeMin,
          range_max: rangeMax,
          y_level: yLevel,
        });
        setValues(
          new Float32Array(response.values),
          response.min_value,
          response.max_value,
        );
      } catch (err) {
        setValues(null, 0, 0);
        setPreviewError(`Preview evaluation failed: ${err}`);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, resolution, rangeMin, rangeMax, yLevel, selectedPreviewNodeId, setValues, setLoading, setPreviewError]);
}
