import { useCallback, useRef, useMemo } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useProjectStore } from "@/stores/projectStore";

const BIOME_COLORS = [
  "#5AACA6", // patina
  "#A67EB8", // amethyst
  "#7a9e68", // moss
  "#C87D3A", // copper
  "#B8648B", // heather
  "#D4A843", // sandstone
  "#5B8DBF", // slate blue
  "#C76B6B", // terra cotta
];

const MIN_GAP = 0.02;
const HANDLE_WIDTH = 8;
const AXIS_PADDING = 24; // px padding on each side of the axis

interface DragState {
  type: "move" | "resize-min" | "resize-max";
  index: number;
  startX: number;
  originalMin: number;
  originalMax: number;
}

interface Overlap {
  i: number;
  j: number;
  min: number;
  max: number;
}

function valueToPercent(value: number): number {
  return ((value + 1) / 2) * 100;
}

function detectOverlaps(ranges: { Min: number; Max: number; Biome: string }[]): Overlap[] {
  const overlaps: Overlap[] = [];
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i].Max > ranges[j].Min && ranges[j].Max > ranges[i].Min) {
        overlaps.push({
          i,
          j,
          min: Math.max(ranges[i].Min, ranges[j].Min),
          max: Math.min(ranges[i].Max, ranges[j].Max),
        });
      }
    }
  }
  return overlaps;
}

export function BiomeRangeEditor() {
  const biomeRanges = useEditorStore((s) => s.biomeRanges);
  const updateBiomeRange = useEditorStore((s) => s.updateBiomeRange);
  const addBiomeRange = useEditorStore((s) => s.addBiomeRange);
  const removeBiomeRange = useEditorStore((s) => s.removeBiomeRange);
  const commitState = useEditorStore((s) => s.commitState);
  const setDirty = useProjectStore((s) => s.setDirty);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const overlaps = useMemo(() => detectOverlaps(biomeRanges), [biomeRanges]);

  const pixelToValue = useCallback((pixelX: number): number => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const usableWidth = rect.width - AXIS_PADDING * 2;
    const ratio = (pixelX - rect.left - AXIS_PADDING) / usableWidth;
    return Math.max(-1, Math.min(1, ratio * 2 - 1));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number, type: DragState["type"]) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        type,
        index,
        startX: e.clientX,
        originalMin: biomeRanges[index].Min,
        originalMax: biomeRanges[index].Max,
      };
    },
    [biomeRanges],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const currentValue = pixelToValue(e.clientX);
      const deltaValue = currentValue - pixelToValue(drag.startX);

      let newMin = drag.originalMin;
      let newMax = drag.originalMax;

      if (drag.type === "move") {
        const width = drag.originalMax - drag.originalMin;
        newMin = drag.originalMin + deltaValue;
        newMax = drag.originalMax + deltaValue;
        // Clamp both ends
        if (newMin < -1) {
          newMin = -1;
          newMax = -1 + width;
        }
        if (newMax > 1) {
          newMax = 1;
          newMin = 1 - width;
        }
      } else if (drag.type === "resize-min") {
        newMin = Math.max(-1, Math.min(drag.originalMax - MIN_GAP, drag.originalMin + deltaValue));
      } else {
        newMax = Math.min(1, Math.max(drag.originalMin + MIN_GAP, drag.originalMax + deltaValue));
      }

      updateBiomeRange(drag.index, { Min: newMin, Max: newMax });
    },
    [pixelToValue, updateBiomeRange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current = null;
      commitState("Drag biome range");
      setDirty(true);
    },
    [commitState, setDirty],
  );

  const handleAddBiome = useCallback(() => {
    addBiomeRange({ Biome: "new_biome", Min: -0.25, Max: 0.25 });
  }, [addBiomeRange]);

  const handleRemove = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      removeBiomeRange(index);
    },
    [removeBiomeRange],
  );

  const ticks = [-1.0, -0.5, 0.0, 0.5, 1.0];

  return (
    <div className="flex flex-col h-full bg-tn-surface border-b border-tn-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-tn-border shrink-0">
        <span className="text-xs font-semibold text-tn-text">Biome Ranges</span>
        <button
          onClick={handleAddBiome}
          className="text-[11px] px-2 py-0.5 rounded bg-tn-accent/20 text-tn-accent hover:bg-tn-accent/30 transition-colors"
        >
          + Add Biome
        </button>
      </div>

      {/* Axis area */}
      <div
        ref={containerRef}
        className="flex-1 relative mx-3 my-1 select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Tick marks and labels */}
        <div className="absolute top-0 left-0 right-0 h-4" style={{ marginLeft: AXIS_PADDING, marginRight: AXIS_PADDING }}>
          {ticks.map((tick) => {
            const pct = valueToPercent(tick);
            return (
              <div key={tick} className="absolute" style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
                <div className="w-px h-2 bg-tn-text-muted mx-auto" />
                <span className="text-[9px] text-tn-text-muted">{tick.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        {/* Range blocks */}
        <div
          className="absolute top-5 left-0 right-0 bottom-4 overflow-y-auto"
          style={{ marginLeft: AXIS_PADDING, marginRight: AXIS_PADDING }}
        >
          <div className="relative" style={{ height: biomeRanges.length * 24 + 8, minHeight: "100%" }}>
            {biomeRanges.map((range, index) => {
              const left = valueToPercent(range.Min);
              const right = valueToPercent(range.Max);
              const width = right - left;
              const color = BIOME_COLORS[index % BIOME_COLORS.length];

              return (
                <div
                  key={index}
                  className="absolute flex items-center group"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${index * 24}px`,
                    height: 20,
                    minWidth: 16,
                  }}
                >
                  {/* Left handle */}
                  <div
                    className="absolute left-0 top-0 bottom-0 cursor-ew-resize z-10 hover:bg-white/20 rounded-l"
                    style={{ width: HANDLE_WIDTH }}
                    onPointerDown={(e) => handlePointerDown(e, index, "resize-min")}
                  />

                  {/* Block body */}
                  <div
                    className="absolute inset-0 rounded cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: `${color}33`, border: `1px solid ${color}88` }}
                    onPointerDown={(e) => handlePointerDown(e, index, "move")}
                  >
                    <span
                      className="text-[10px] font-medium truncate px-2 pointer-events-none"
                      style={{ color }}
                    >
                      {range.Biome}
                    </span>
                  </div>

                  {/* Right handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 cursor-ew-resize z-10 hover:bg-white/20 rounded-r"
                    style={{ width: HANDLE_WIDTH }}
                    onPointerDown={(e) => handlePointerDown(e, index, "resize-max")}
                  />

                  {/* Delete button */}
                  <button
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white text-[9px] leading-none opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center"
                    onClick={(e) => handleRemove(e, index)}
                  >
                    x
                  </button>
                </div>
              );
            })}

            {/* Overlap overlays */}
            {overlaps.map((overlap, idx) => {
              const left = valueToPercent(overlap.min);
              const right = valueToPercent(overlap.max);
              const width = right - left;
              return (
                <div
                  key={`overlap-${idx}`}
                  className="absolute rounded pointer-events-none"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    bottom: 0,
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px dashed rgba(239, 68, 68, 0.4)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Overlap warnings */}
        {overlaps.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            {overlaps.map((overlap, idx) => (
              <span key={idx} className="text-[9px] text-red-400 mr-3">
                Overlap: {biomeRanges[overlap.i].Biome} & {biomeRanges[overlap.j].Biome} ({overlap.min.toFixed(2)} to {overlap.max.toFixed(2)})
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
