// Lightweight local debounce to avoid adding a dependency for this small utility.
function debounce(fn: (...args: any[]) => void, wait = 150) {
  let t: ReturnType<typeof setTimeout> | null = null;
  function cancel() {
    if (t) {
      clearTimeout(t);
      t = null;
    }
  }
  const debounced = (...args: any[]) => {
    cancel();
    t = setTimeout(() => fn(...args), wait);
  };
  (debounced as any).cancel = cancel;
  return debounced as ((...args: any[]) => void) & { cancel: () => void };
}
import { applyVisualsToPreview, VisualsEvaluationResult } from "@/preview/visualsPreviewAdapter";
import { useEditorStore } from "@/stores/editorStore";

// Simple shallow evaluator: finds Visual:Fog, Visual:Ambient, Visual:TimeOfDay nodes
// in the active editor graph and extracts their fields for preview.

function evalFromNodes(nodes: any[], edges: any[]): VisualsEvaluationResult {
  const res: VisualsEvaluationResult = {};

  function findNodeByType(type: string) {
    // Prefer nodes marked as output (data._outputNode)
    let out = nodes.find((n) => ((n.data && (n.data as any)._outputNode) && n.type === type));
    if (!out) out = nodes.find((n) => n.type === type);
    return out;
  }

  function findIncomingEdge(targetNodeId: string, targetHandleId: string) {
    return edges.find((e) => e.target === targetNodeId && (e.targetHandle ?? "") === targetHandleId);
  }

  // Evaluate a node recursively to resolve tint/environment outputs.
  function evaluateNodeColor(nodeId: string | null, visited = new Set<string>()): string | undefined {
    if (!nodeId) return undefined;
    if (visited.has(nodeId)) return undefined; // cycle
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return undefined;
    const t = node.type as string;
    const f = (node.data && (node.data as any).fields) || {};

    // Specific handlers for common tint-producing nodes
    if (t === "Tint:Constant") return f.Color;
    if (t === "Tint:Gradient") return f.From ?? f.To;
    if (t === "Tint:Imported") return f.Color ?? undefined;
    if (t === "Tint:DensityDelimited") return f.Color ?? f.From ?? undefined;
    if (t === "Tint:Exported") {
      // Forward to whatever is connected to its Input handle
      const inc = findIncomingEdge(nodeId, "Input");
      if (inc) return evaluateNodeColor(inc.source, visited);
      return undefined;
    }

    // Generic fallback: if the node exposes a Color/From/SkyColor field, use it
    if (typeof f.Color === "string") return f.Color;
    if (typeof f.From === "string") return f.From;
    if (typeof f.SkyColor === "string") return f.SkyColor;

    return undefined;
  }

  // Helper: for a node (e.g. Visual:Fog) attempt to resolve a color for a given input handle
  function resolveColorForHandle(node: any, handleId: string, defaultValue?: string) {
    // 1) If there is an incoming edge, evaluate the source node
    const inc = findIncomingEdge(node.id, handleId);
    if (inc) {
      const col = evaluateNodeColor(inc.source);
      if (col) return col;
    }
    // 2) Fall back to the node's own field value
    const f = (node.data && (node.data as any).fields) || {};
    if (handleId === "Color") return f.Color ?? defaultValue;
    if (handleId === "SkyColor") return f.SkyColor ?? defaultValue;
    if (handleId === "GroundColor") return f.GroundColor ?? defaultValue;
    return defaultValue;
  }

  const fog = findNodeByType("Visual:Fog");
  if (fog) {
    const color = resolveColorForHandle(fog, "Color", "#c0d8f0");
    const f = (fog.data && (fog.data as any).fields) || {};
    const density = Number(f.Density ?? 0.008);
    res.fog = { color, density };
  }

  const ambient = findNodeByType("Visual:Ambient");
  if (ambient) {
    const sky = resolveColorForHandle(ambient, "SkyColor", "#87CEEB");
    const ground = resolveColorForHandle(ambient, "GroundColor", "#8B7355");
    const a = (ambient.data && (ambient.data as any).fields) || {};
    res.ambient = { skyColor: sky, groundColor: ground, intensity: Number(a.Intensity ?? 0.4) };
  }

  const tod = findNodeByType("Visual:TimeOfDay");
  if (tod) {
    const t = (tod.data && (tod.data as any).fields) || {};
    // TimeOfDay node currently has no input handles in the MVP; keep existing behavior
    res.timeOfDay = { time: Number(t.Time ?? 12), sunColor: t.SunColor ?? undefined, sunIntensity: t.SunIntensity ?? undefined };
  }

  return res;
}

// Debounced apply
const applyDebounced = debounce((...args: any[]) => {
  const nodes = args[0] as any[];
  const edges = args[1] as any[];
  const result = evalFromNodes(nodes, edges);
  applyVisualsToPreview(result);
}, 150);

export function startVisualsShallowWatcher() {
  // Subscribe to editor store node/edge changes
  // Subscribe only to nodes and edges so we don't fire on unrelated state changes
  // Subscribe to the entire editor state but only act on node/edge changes
  const unsub = useEditorStore.subscribe((s) => {
    applyDebounced(s.nodes, s.edges);
  });

  // Immediately evaluate once
  const nodes = useEditorStore.getState().nodes;
  const edges = useEditorStore.getState().edges;
  applyDebounced(nodes, edges);

  return () => {
    unsub();
    applyDebounced.cancel();
  };
}
