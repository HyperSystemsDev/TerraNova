import { useState } from "react";
import { MATERIAL_COLORS, type MaterialLayer } from "@/utils/biomeSectionUtils";
import { LAYER_TYPES, LAYER_TYPE_LABELS } from "./constants";
import type { LayerType } from "@/schema/material";

export function InteractiveLayerCard({
  layer,
  layerIndex,
  onClick,
  onRemove,
  onChangeType,
  onDragStart,
}: {
  layer: MaterialLayer;
  layerIndex: number;
  onClick: () => void;
  onRemove: () => void;
  onChangeType: (type: string) => void;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  const color = MATERIAL_COLORS[layer.material.toLowerCase()] ?? "#666";

  return (
    <div className="flex items-center gap-1.5 p-2 rounded border border-tn-border bg-white/[0.02] transition-all duration-150 hover:border-white/20 hover:bg-white/5">
      {/* Drag handle */}
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none select-none p-0.5"
        onPointerDown={onDragStart}
      >
        <svg className="w-3.5 h-3.5 text-tn-text-muted" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.2" />
          <circle cx="11" cy="4" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="12" r="1.2" />
          <circle cx="11" cy="12" r="1.2" />
        </svg>
      </div>

      {/* Color swatch */}
      <button
        onClick={onClick}
        className="w-6 h-6 rounded shrink-0 border border-white/10 hover:border-white/30 transition-colors"
        style={{ backgroundColor: color }}
        title={`Select ${layer.material}`}
      />

      {/* Info */}
      <div onClick={onClick} className="flex-1 min-w-0 text-left cursor-pointer" role="button" tabIndex={0}>
        <div className="text-xs font-medium text-tn-text capitalize truncate">
          {layer.material}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Layer type badge */}
          <span
            onClick={(e) => { e.stopPropagation(); setTypeOpen((v) => !v); }}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded leading-none bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer"
            title="Change layer type"
            role="button"
            tabIndex={0}
          >
            {layer.layerType ? LAYER_TYPE_LABELS[layer.layerType as LayerType] ?? layer.layerType : `Layer ${layerIndex}`}
          </span>
          {/* Thickness info */}
          {layer.thickness != null && (
            <span className="text-[10px] text-tn-text-muted">
              t: {layer.thickness}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="shrink-0 p-1 rounded text-tn-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        title="Remove layer"
      >
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      {/* Type selector dropdown */}
      {typeOpen && (
        <div className="absolute z-20 mt-1 right-2 top-full bg-tn-panel border border-tn-border rounded shadow-lg py-1 min-w-[140px]">
          {LAYER_TYPES.map((t) => (
            <button
              key={t}
              onClick={(e) => {
                e.stopPropagation();
                onChangeType(t);
                setTypeOpen(false);
              }}
              className={`w-full text-left px-3 py-1 text-[11px] hover:bg-white/5 transition-colors ${
                t === layer.layerType ? "text-amber-400 font-medium" : "text-tn-text"
              }`}
            >
              {LAYER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
