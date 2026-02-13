import type { Node, Edge } from "@xyflow/react";

export interface ClipboardData {
  version: "1";
  nodes: Node[];
  edges: Edge[];
}

/**
 * Copy the selected nodes and their internal edges to the system clipboard.
 * Returns the ClipboardData for use as an internal fallback.
 */
export function copyNodesToClipboard(
  nodes: Node[],
  edges: Edge[],
): ClipboardData | null {
  const selected = nodes.filter((n) => n.selected);
  if (selected.length === 0) return null;

  const selectedIds = new Set(selected.map((n) => n.id));

  // Keep only edges where both endpoints are in the selection
  const internalEdges = edges.filter(
    (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
  );

  const data: ClipboardData = {
    version: "1",
    nodes: structuredClone(selected),
    edges: structuredClone(internalEdges),
  };

  // Write to system clipboard (fire-and-forget)
  try {
    navigator.clipboard.writeText(JSON.stringify(data));
  } catch {
    // Clipboard API may not be available (e.g. Tauri, non-secure context)
  }

  return data;
}

/**
 * Generate new nodes/edges from clipboard data with fresh UUIDs and offset positions.
 * All pasted nodes are marked as selected.
 */
export function pasteNodesFromClipboard(
  clipboardData: ClipboardData,
  offsetX: number = 50,
  offsetY: number = 50,
): { nodes: Node[]; edges: Edge[] } {
  // Build old-ID → new-ID map
  const idMap = new Map<string, string>();
  for (const node of clipboardData.nodes) {
    idMap.set(node.id, crypto.randomUUID());
  }

  const nodes: Node[] = clipboardData.nodes.map((n) => ({
    ...structuredClone(n),
    id: idMap.get(n.id)!,
    position: { x: n.position.x + offsetX, y: n.position.y + offsetY },
    selected: true,
  }));

  const edges: Edge[] = clipboardData.edges.map((e) => ({
    ...structuredClone(e),
    id: crypto.randomUUID(),
    source: idMap.get(e.source) ?? e.source,
    target: idMap.get(e.target) ?? e.target,
  }));

  return { nodes, edges };
}

/**
 * Read clipboard data from the system clipboard.
 * Returns null if the clipboard doesn't contain valid TerraNova node data.
 */
export async function readClipboardData(): Promise<ClipboardData | null> {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);
    if (
      parsed &&
      parsed.version === "1" &&
      Array.isArray(parsed.nodes) &&
      Array.isArray(parsed.edges)
    ) {
      return parsed as ClipboardData;
    }
  } catch {
    // Not valid JSON or clipboard not available
  }
  return null;
}
