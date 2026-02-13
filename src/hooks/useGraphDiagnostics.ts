import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useDiagnosticsStore } from "@/stores/diagnosticsStore";
import { analyzeGraph } from "@/utils/graphDiagnostics";

/**
 * Subscribes to editor nodes/edges and runs analyzeGraph() on a 300ms debounce,
 * pushing results to the shared diagnosticsStore.
 */
export function useGraphDiagnostics() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const setDiagnostics = useDiagnosticsStore((s) => s.setDiagnostics);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const diags = analyzeGraph(nodes, edges);
      setDiagnostics(diags);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, setDiagnostics]);
}
