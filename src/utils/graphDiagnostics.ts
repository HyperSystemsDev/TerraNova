import type { Node, Edge } from "@xyflow/react";
import type { BaseNodeData } from "@/nodes/shared/BaseNode";
import { HANDLE_REGISTRY } from "@/nodes/handleRegistry";
import { FIELD_CONSTRAINTS, OUTPUT_RANGES } from "@/schema/constraints";
import { validateFields } from "@/schema/validation";
import { isLegacyTypeKey } from "@/nodes/shared/legacyTypes";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface GraphDiagnostic {
  nodeId: string | null;
  message: string;
  severity: DiagnosticSeverity;
}

const UNSUPPORTED_TYPES = new Set([
  "HeightAboveSurface",
  "SurfaceDensity",
  "TerrainBoolean",
  "TerrainMask",
  "BeardDensity",
  "ColumnDensity",
  "CaveDensity",
  "ImportedValue",
]);

function getNodeType(node: Node): string {
  return (node.data as BaseNodeData).type ?? "";
}

function getNodeFields(node: Node): Record<string, unknown> {
  return (node.data as BaseNodeData).fields ?? {};
}

/** Extract Min/Max from a nested range object like { Min: -1, Max: 1 } */
function getRangeValues(obj: unknown): [number, number] | undefined {
  if (obj && typeof obj === "object" && "Min" in (obj as Record<string, unknown>) && "Max" in (obj as Record<string, unknown>)) {
    const r = obj as { Min: number; Max: number };
    if (typeof r.Min === "number" && typeof r.Max === "number") {
      return [r.Min, r.Max];
    }
  }
  return undefined;
}

export function analyzeGraph(nodes: Node[], edges: Edge[]): GraphDiagnostic[] {
  if (nodes.length === 0) return [];

  const diagnostics: GraphDiagnostic[] = [];

  // Build lookup maps
  const incomingByTarget = new Map<string, Set<string>>();
  const outgoingBySource = new Map<string, Set<string>>();
  const adjacency = new Map<string, Set<string>>(); // target → set of sources

  for (const edge of edges) {
    // Target handle tracking
    if (!incomingByTarget.has(edge.target)) incomingByTarget.set(edge.target, new Set());
    incomingByTarget.get(edge.target)!.add(edge.targetHandle ?? "Input");

    // Outgoing tracking
    if (!outgoingBySource.has(edge.source)) outgoingBySource.set(edge.source, new Set());
    outgoingBySource.get(edge.source)!.add(edge.target);

    // Adjacency (directed: source → target)
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    adjacency.get(edge.source)!.add(edge.target);
  }

  // 1. Disconnected required inputs
  for (const node of nodes) {
    const type = getNodeType(node);
    const handles = HANDLE_REGISTRY[type];
    if (!handles) continue;

    const connectedHandles = incomingByTarget.get(node.id) ?? new Set();
    const inputHandles = handles.filter((h) => h.type === "target");
    const showIdx = inputHandles.length >= 2;
    for (let idx = 0; idx < inputHandles.length; idx++) {
      const handle = inputHandles[idx];
      if (!connectedHandles.has(handle.id)) {
        const label = showIdx ? `[${idx}] ${handle.label}` : handle.label;
        diagnostics.push({
          nodeId: node.id,
          message: `${type}: input "${label}" is disconnected`,
          severity: "warning",
        });
      }
    }
  }

  // 2. Unsupported preview types
  for (const node of nodes) {
    const type = getNodeType(node);
    if (UNSUPPORTED_TYPES.has(type)) {
      diagnostics.push({
        nodeId: node.id,
        message: `${type}: not supported in preview (returns 0)`,
        severity: "info",
      });
    }
  }

  // 2b. Legacy node warnings
  for (const node of nodes) {
    const type = getNodeType(node);
    // Density nodes use bare type; for others, the node.type from ReactFlow includes the prefix
    const nodeTypeKey = node.type ?? type;
    if (isLegacyTypeKey(nodeTypeKey)) {
      diagnostics.push({
        nodeId: node.id,
        message: `${type}: legacy type not present in the Hytale pre-release API`,
        severity: "warning",
      });
    }
  }

  // 3. Cycle detection — Kahn's algorithm
  //    Use an array (not Set) for adjacency so parallel edges between the same
  //    node pair (e.g. Noise → Sum.InputA AND Noise → Sum.InputB) are preserved.
  //    Each edge must decrement in-degree exactly once.
  const kahnAdj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    kahnAdj.set(node.id, []);
  }
  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    kahnAdj.get(edge.source)?.push(edge.target);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  let sorted = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted++;
    const neighbors = kahnAdj.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }
  }

  if (sorted < nodes.length) {
    // Some nodes are in a cycle
    const cycleNodes = nodes.filter((n) => (inDegree.get(n.id) ?? 0) > 0);
    for (const node of cycleNodes) {
      diagnostics.push({
        nodeId: node.id,
        message: `${getNodeType(node)}: part of a cycle`,
        severity: "error",
      });
    }
  }

  // 4. Dead nodes — BFS backward from terminal nodes
  // Terminals are nodes with no outgoing edges that have at least one incoming edge (true sinks)
  const nodesWithIncoming = new Set(edges.map((e) => e.target));
  const terminals = nodes.filter((n) => !outgoingBySource.has(n.id) && nodesWithIncoming.has(n.id));

  // Build reverse adjacency: target → sources
  const reverseAdj = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!reverseAdj.has(edge.target)) reverseAdj.set(edge.target, new Set());
    reverseAdj.get(edge.target)!.add(edge.source);
  }

  const reachable = new Set<string>();
  const bfsQueue = terminals.map((n) => n.id);
  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);
    const parents = reverseAdj.get(current);
    if (parents) {
      for (const parent of parents) {
        if (!reachable.has(parent)) bfsQueue.push(parent);
      }
    }
  }

  // Only report dead nodes if there are actual terminal sinks
  if (terminals.length > 0) {
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        diagnostics.push({
          nodeId: node.id,
          message: `${getNodeType(node)}: unreachable (dead node)`,
          severity: "warning",
        });
      }
    }
  }

  // 5. Clamp Min > Max warning
  for (const node of nodes) {
    const type = getNodeType(node);
    if (type === "Clamp" || type === "SmoothClamp") {
      const fields = getNodeFields(node);
      const min = typeof fields.Min === "number" ? fields.Min : undefined;
      const max = typeof fields.Max === "number" ? fields.Max : undefined;
      if (min !== undefined && max !== undefined && min > max) {
        diagnostics.push({
          nodeId: node.id,
          message: `${type}: Min (${min}) exceeds Max (${max}) — empty range`,
          severity: "warning",
        });
      }
    }
  }

  // 6. Normalizer inverted range
  for (const node of nodes) {
    const type = getNodeType(node);
    if (type === "Normalizer") {
      const fields = getNodeFields(node);
      const sourceRange = getRangeValues(fields.SourceRange);
      if (sourceRange && sourceRange[0] >= sourceRange[1]) {
        diagnostics.push({
          nodeId: node.id,
          message: `Normalizer: SourceRange Min (${sourceRange[0]}) >= Max (${sourceRange[1]}) — inverted input range`,
          severity: "warning",
        });
      }
    }
  }

  // 7. Empty Sum/Product inputs
  const MULTI_INPUT_TYPES = new Set(["Sum", "Product"]);
  for (const node of nodes) {
    const type = getNodeType(node);
    if (MULTI_INPUT_TYPES.has(type)) {
      const connectedHandles = incomingByTarget.get(node.id);
      if (!connectedHandles || connectedHandles.size === 0) {
        diagnostics.push({
          nodeId: node.id,
          message: `${type}: no inputs connected`,
          severity: "warning",
        });
      }
    }
  }

  // 8. Field constraint violations (bridge per-field validation into graph diagnostics)
  for (const node of nodes) {
    const type = getNodeType(node);
    const constraints = FIELD_CONSTRAINTS[type];
    if (!constraints) continue;

    const fields = getNodeFields(node);
    const issues = validateFields(fields, constraints);
    for (const issue of issues) {
      diagnostics.push({
        nodeId: node.id,
        message: `${type}.${issue.field}: ${issue.message}`,
        severity: issue.severity,
      });
    }
  }

  // 9. Output range mismatch hints
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    const sourceType = getNodeType(sourceNode);
    const targetType = getNodeType(targetNode);
    const sourceRange = OUTPUT_RANGES[sourceType];
    if (!sourceRange) continue;

    // Check Clamp/SmoothClamp targets: only warn if source is entirely outside clamp range
    if (targetType === "Clamp" || targetType === "SmoothClamp") {
      const fields = getNodeFields(targetNode);
      const clampMin = typeof fields.Min === "number" ? fields.Min : undefined;
      const clampMax = typeof fields.Max === "number" ? fields.Max : undefined;
      if (clampMin !== undefined && clampMax !== undefined) {
        // Source entirely below clamp range — output will always be clampMin
        if (sourceRange[1] < clampMin) {
          diagnostics.push({
            nodeId: targetNode.id,
            message: `${sourceType} output [${sourceRange[0]}, ${sourceRange[1]}] is entirely below Min (${clampMin}) — output will always be ${clampMin}`,
            severity: "info",
          });
        }
        // Source entirely above clamp range — output will always be clampMax
        if (sourceRange[0] > clampMax) {
          diagnostics.push({
            nodeId: targetNode.id,
            message: `${sourceType} output [${sourceRange[0]}, ${sourceRange[1]}] is entirely above Max (${clampMax}) — output will always be ${clampMax}`,
            severity: "info",
          });
        }
      }
    }

    // Check Normalizer targets: source range vs SourceRange.Min/Max
    if (targetType === "Normalizer") {
      const fields = getNodeFields(targetNode);
      const srcRange = getRangeValues(fields.SourceRange);
      if (srcRange) {
        // Source entirely outside normalizer's expected input range
        if (sourceRange[1] < srcRange[0] || sourceRange[0] > srcRange[1]) {
          diagnostics.push({
            nodeId: targetNode.id,
            message: `${sourceType} output [${sourceRange[0]}, ${sourceRange[1]}] is entirely outside Normalizer input range [${srcRange[0]}, ${srcRange[1]}]`,
            severity: "info",
          });
        }
      }
    }
  }

  return diagnostics;
}
