import type { Node, Edge } from "@xyflow/react";

/** Approximate node center for edge intersection checks */
export const NODE_CENTER_OFFSET_X = 110;
export const NODE_CENTER_OFFSET_Y = 50;

/** BFS from a node to find all downstream edge IDs */
export function getDownstreamEdgeIds(nodeId: string, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const edge of edges) {
      if (edge.source === current && !result.has(edge.id)) {
        result.add(edge.id);
        queue.push(edge.target);
      }
    }
  }

  return result;
}

/** BFS from a node to find all upstream edge IDs */
export function getUpstreamEdgeIds(nodeId: string, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const edge of edges) {
      if (edge.target === current && !result.has(edge.id)) {
        result.add(edge.id);
        queue.push(edge.source);
      }
    }
  }

  return result;
}

/** BFS in both directions from a node, returning upstream and downstream edge ID sets */
export function getBidirectionalEdgeIds(
  nodeId: string,
  edges: Edge[],
): { upstream: Set<string>; downstream: Set<string> } {
  // Build adjacency maps once
  const forwardAdj = new Map<string, Edge[]>();
  const reverseAdj = new Map<string, Edge[]>();

  for (const edge of edges) {
    let fwd = forwardAdj.get(edge.source);
    if (!fwd) { fwd = []; forwardAdj.set(edge.source, fwd); }
    fwd.push(edge);

    let rev = reverseAdj.get(edge.target);
    if (!rev) { rev = []; reverseAdj.set(edge.target, rev); }
    rev.push(edge);
  }

  // Downstream BFS (source → target)
  const downstream = new Set<string>();
  {
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of forwardAdj.get(current) ?? []) {
        if (!downstream.has(edge.id)) {
          downstream.add(edge.id);
          queue.push(edge.target);
        }
      }
    }
  }

  // Upstream BFS (target → source)
  const upstream = new Set<string>();
  {
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const edge of reverseAdj.get(current) ?? []) {
        if (!upstream.has(edge.id)) {
          upstream.add(edge.id);
          queue.push(edge.source);
        }
      }
    }
  }

  return { upstream, downstream };
}

/** Distance from point (px, py) to the line segment (x1,y1)-(x2,y2) */
export function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/** Find the nearest edge to a drop point, or null if none within threshold */
export function findNearestEdge(
  point: { x: number; y: number },
  nodes: Node[],
  edges: Edge[],
  threshold = 50,
): Edge | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let bestEdge: Edge | null = null;
  let bestDist = threshold;

  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    const sx = sourceNode.position.x + NODE_CENTER_OFFSET_X;
    const sy = sourceNode.position.y + NODE_CENTER_OFFSET_Y;
    const tx = targetNode.position.x + NODE_CENTER_OFFSET_X;
    const ty = targetNode.position.y + NODE_CENTER_OFFSET_Y;

    const dist = pointToSegmentDistance(point.x, point.y, sx, sy, tx, ty);
    if (dist < bestDist) {
      bestDist = dist;
      bestEdge = edge;
    }
  }

  return bestEdge;
}
