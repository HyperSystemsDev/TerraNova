import { MATERIAL_COLORS, type MaterialLayer } from "@/utils/biomeSectionUtils";
import { ROLE_COLORS } from "./constants";

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? "#8C8878";
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded leading-none"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {role}
    </span>
  );
}

function ReadOnlyLayerCard({ layer, onClick }: { layer: MaterialLayer; onClick: () => void }) {
  const color = MATERIAL_COLORS[layer.material.toLowerCase()] ?? "#666";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 p-2 rounded border border-tn-border text-left transition-all duration-150 hover:border-white/20 hover:bg-white/5"
    >
      <div
        className="w-6 h-6 rounded shrink-0 border border-white/10"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-tn-text capitalize">
          {layer.material}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <RoleBadge role={layer.role} />
          {layer.depth != null && (
            <span className="text-[10px] text-tn-text-muted">
              depth: {layer.depth}
            </span>
          )}
        </div>
      </div>
      <svg className="w-3.5 h-3.5 text-tn-text-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4l4 4-4 4" />
      </svg>
    </button>
  );
}

export function V1ReadOnlyView({
  layers,
  onSelectNode,
}: {
  layers: MaterialLayer[];
  onSelectNode: (id: string) => void;
}) {
  if (layers.length === 0) {
    return (
      <div className="flex flex-col p-3 gap-3">
        <div className="border-b border-tn-border pb-2">
          <h3 className="text-sm font-semibold">Material Layers</h3>
          <p className="text-xs text-tn-text-muted">No material layers detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3 gap-3">
      <div className="border-b border-tn-border pb-2">
        <h3 className="text-sm font-semibold">Material Layers</h3>
        <p className="text-xs text-tn-text-muted">
          {layers.length} material{layers.length !== 1 ? "s" : ""} detected (read-only)
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {layers.map((layer, i) => (
          <ReadOnlyLayerCard
            key={`${layer.nodeId}-${i}`}
            layer={layer}
            onClick={() => onSelectNode(layer.nodeId)}
          />
        ))}
      </div>
    </div>
  );
}
