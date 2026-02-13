import { useState, useCallback } from "react";
import { normalizePoints, toOutputFormat, round4 } from "@/utils/curveEvaluators";

interface CurvePointListProps {
  points: unknown[];
  onChange?: (points: [number, number][]) => void;
  onCommit?: () => void;
}

export function CurvePointList({ points, onChange, onCommit }: CurvePointListProps) {
  const [expanded, setExpanded] = useState(true);

  // Normalize from any format ({x,y} or [x,y]) to sorted {x,y,origIdx}
  const normalized = normalizePoints(points);
  const sorted = normalized
    .map((p, i) => ({ x: p.x, y: p.y, origIdx: i }))
    .sort((a, b) => a.x - b.x);

  const updatePoint = useCallback(
    (origIdx: number, axis: "x" | "y", raw: string) => {
      const val = parseFloat(raw);
      if (isNaN(val)) return;
      const current = normalizePoints(points);
      const updated = current.map((p, i) =>
        i === origIdx
          ? { x: axis === "x" ? round4(val) : p.x, y: axis === "y" ? round4(val) : p.y }
          : p,
      );
      onChange?.(toOutputFormat(updated));
    },
    [points, onChange],
  );

  const removePoint = useCallback(
    (origIdx: number) => {
      if (points.length <= 2) return;
      const current = normalizePoints(points);
      const updated = current.filter((_, i) => i !== origIdx);
      onChange?.(toOutputFormat(updated));
      onCommit?.();
    },
    [points, onChange, onCommit],
  );

  const addPoint = useCallback(() => {
    let newX = 0.5;
    let newY = 0.5;
    if (sorted.length >= 2) {
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      newX = round4((prev.x + last.x) / 2);
      newY = round4((prev.y + last.y) / 2);
    }
    const current = normalizePoints(points);
    const updated = [...current, { x: newX, y: newY }];
    onChange?.(toOutputFormat(updated));
    onCommit?.();
  }, [points, sorted, onChange, onCommit]);

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-tn-text-muted hover:text-tn-text w-full text-left"
      >
        <span className="text-[10px]">{expanded ? "\u25BC" : "\u25B6"}</span>
        <span>Points ({points.length})</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-1">
          {/* Header */}
          <div className="grid grid-cols-[20px_1fr_1fr_20px] gap-1 text-[10px] text-tn-text-muted px-0.5">
            <span>#</span>
            <span>In</span>
            <span>Out</span>
            <span />
          </div>

          {sorted.map((pt, sortIdx) => (
            <div
              key={sortIdx}
              className="grid grid-cols-[20px_1fr_1fr_20px] gap-1 items-center"
            >
              <span className="text-[10px] text-tn-text-muted">{sortIdx}</span>
              <input
                type="number"
                step="0.01"
                defaultValue={pt.x}
                key={`${pt.origIdx}-x-${pt.x}`}
                onBlur={(e) => {
                  updatePoint(pt.origIdx, "x", e.target.value);
                  onCommit?.();
                }}
                className="w-full px-1.5 py-0.5 text-xs bg-tn-bg border border-tn-border rounded"
              />
              <input
                type="number"
                step="0.01"
                defaultValue={pt.y}
                key={`${pt.origIdx}-y-${pt.y}`}
                onBlur={(e) => {
                  updatePoint(pt.origIdx, "y", e.target.value);
                  onCommit?.();
                }}
                className="w-full px-1.5 py-0.5 text-xs bg-tn-bg border border-tn-border rounded"
              />
              <button
                onClick={() => removePoint(pt.origIdx)}
                disabled={points.length <= 2}
                className="text-[10px] text-tn-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove point"
              >
                x
              </button>
            </div>
          ))}

          <button
            onClick={addPoint}
            className="text-[10px] text-tn-text-muted hover:text-tn-text border border-dashed border-tn-border rounded px-2 py-0.5 mt-0.5"
          >
            + Add point
          </button>
        </div>
      )}
    </div>
  );
}
