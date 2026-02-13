import { useEditorStore } from "@/stores/editorStore";
import { SliderField } from "./SliderField";
import { ToggleField } from "./ToggleField";
import { PropPlacementGrid } from "./PropPlacementGrid";
import type { Node, Edge } from "@xyflow/react";

interface PropOverviewPanelProps {
  propIndex: number;
  onPropMetaChange: (index: number, field: string, value: unknown) => void;
  onBlur: () => void;
}

function getNodeType(node: Node): string {
  return ((node.data as Record<string, unknown>).type as string) ?? "";
}

function getFieldSummary(node: Node): string {
  const data = node.data as Record<string, unknown>;
  const fields = (data.fields as Record<string, unknown>) ?? {};
  const parts: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
      parts.push(`${k}=${v}`);
    }
  }
  return parts.join(", ");
}

export function PropOverviewPanel({
  propIndex,
  onPropMetaChange,
  onBlur,
}: PropOverviewPanelProps) {
  const biomeConfig = useEditorStore((s) => s.biomeConfig);
  const biomeSections = useEditorStore((s) => s.biomeSections);
  const activeBiomeSection = useEditorStore((s) => s.activeBiomeSection);
  const liveNodes = useEditorStore((s) => s.nodes);
  const liveEdges = useEditorStore((s) => s.edges);

  if (!biomeConfig || !biomeSections) return null;

  const sectionKey = `Props[${propIndex}]`;
  const section = biomeSections[sectionKey];
  if (!section) return null;

  const propMeta = biomeConfig.propMeta[propIndex];
  if (!propMeta) return null;

  // Use live graph state when this section is currently active,
  // otherwise fall back to the stored section data
  const isActive = activeBiomeSection === sectionKey;
  const nodes = isActive ? liveNodes : section.nodes;
  const edges = isActive ? liveEdges : section.edges;

  // Find tagged root nodes for Positions and Assignments
  const posRoot = nodes.find(
    (n) => (n.data as Record<string, unknown>)._biomeField === "Positions",
  );
  const asgnRoot = nodes.find(
    (n) => (n.data as Record<string, unknown>)._biomeField === "Assignments",
  );

  const posType = posRoot ? getNodeType(posRoot) : "None";
  const posParams = posRoot ? getFieldSummary(posRoot) : "";

  const asgnType = asgnRoot ? getNodeType(asgnRoot) : "None";

  // Build assignments chain by BFS from assignments root
  const asgnNodes = asgnRoot ? getReachableNodes(asgnRoot.id, nodes, edges) : [];
  const asgnChain = asgnNodes
    .map(getNodeType)
    .filter(Boolean)
    .join(" \u2192 ");

  return (
    <div className="flex flex-col p-3 gap-3">
      <div className="border-b border-tn-border pb-2">
        <h3 className="text-sm font-semibold">Prop {propIndex}</h3>
        <p className="text-xs text-tn-text-muted">
          {nodes.length} nodes, {edges.length} edges
        </p>
      </div>

      {/* Positions Summary */}
      <div
        className="p-2.5 rounded border border-tn-border"
        style={{ backgroundColor: "rgba(107, 158, 90, 0.08)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {/* Pin icon — represents position/placement */}
          <svg className="w-3.5 h-3.5 shrink-0 text-[#6B9E5A]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6" r="3" />
            <path d="M8 9v5" />
          </svg>
          <span className="text-xs font-medium text-[#6B9E5A]">Positions</span>
        </div>
        <div className="text-xs text-tn-text">{posType}</div>
        {posParams && (
          <div className="text-[10px] text-tn-text-muted mt-0.5">{posParams}</div>
        )}
      </div>

      {/* Assignments Summary */}
      <div
        className="p-2.5 rounded border border-tn-border"
        style={{ backgroundColor: "rgba(139, 115, 85, 0.08)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {/* Tag icon — represents assignment/binding */}
          <svg className="w-3.5 h-3.5 shrink-0 text-[#8B7355]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 8.5V2.5a1 1 0 011-1h6l7 7-6 6-7-7z" />
            <circle cx="5" cy="5.5" r="1" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-[#8B7355]">Assignments</span>
        </div>
        <div className="text-xs text-tn-text">{asgnType}</div>
        {asgnChain && asgnChain !== asgnType && (
          <div className="text-[10px] text-tn-text-muted mt-0.5 truncate">{asgnChain}</div>
        )}
      </div>

      {/* Prop Meta Controls */}
      <div className="border-t border-tn-border pt-2 mt-1">
        <h4 className="text-xs font-semibold text-tn-text-muted mb-2">Settings</h4>
        <div className="flex flex-col gap-3">
          <SliderField
            label="Runtime"
            value={propMeta.Runtime}
            min={0}
            max={3}
            step={1}
            onChange={(v) => onPropMetaChange(propIndex, "Runtime", v)}
            onBlur={onBlur}
          />
          <ToggleField
            label="Skip"
            value={propMeta.Skip}
            onChange={(v) => onPropMetaChange(propIndex, "Skip", v)}
          />
        </div>
      </div>

      {/* Placement Visualizer */}
      <div className="border-t border-tn-border pt-2 mt-1">
        <PropPlacementGrid nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

/** Walk upstream from a root node, collecting nodes in BFS order. */
function getReachableNodes(rootId: string, nodes: Node[], edges: Edge[]): Node[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const upstream = new Map<string, string[]>();
  for (const e of edges) {
    const list = upstream.get(e.target) ?? [];
    list.push(e.source);
    upstream.set(e.target, list);
  }

  const visited = new Set<string>();
  const result: Node[] = [];
  const queue = [rootId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeById.get(id);
    if (node) result.push(node);
    for (const parent of upstream.get(id) ?? []) {
      if (!visited.has(parent)) queue.push(parent);
    }
  }

  return result;
}

