import { useEffect, useRef } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useEditorStore } from "@/stores/editorStore";
import { evaluatePositions, type WorldRange } from "@/utils/positionEvaluator";

/**
 * Watches position overlay state + graph, debounces calls to evaluatePositions(),
 * and stores results in previewStore.
 */
export function usePositionOverlay() {
  const showOverlay = usePreviewStore((s) => s.showPositionOverlay);
  const overlayNodeId = usePreviewStore((s) => s.positionOverlayNodeId);
  const seed = usePreviewStore((s) => s.positionOverlaySeed);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const setPoints = usePreviewStore((s) => s.setPositionOverlayPoints);

  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showOverlay) {
      setPoints([]);
      return;
    }

    // Debounce 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const range: WorldRange = {
        minX: rangeMin,
        maxX: rangeMax,
        minZ: rangeMin,
        maxZ: rangeMax,
      };

      const result = evaluatePositions(
        nodes,
        edges,
        range,
        seed,
        overlayNodeId ?? undefined,
      );

      setPoints(result);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showOverlay, overlayNodeId, seed, rangeMin, rangeMax, nodes, edges, setPoints]);
}
