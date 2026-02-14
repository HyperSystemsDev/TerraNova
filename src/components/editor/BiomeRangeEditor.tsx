import { useCallback, useRef, useMemo, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useProjectStore } from "@/stores/projectStore";

const MIN_GAP = 0.02;
const ROW_H = 28;

type SortKey = "name" | "min" | "max" | "width";
type SortDir = "asc" | "desc";

/** Deterministic HSL color from biome name */
function biomeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const h = ((hash % 360) + 360) % 360;
  return `hsl(${h}, 58%, 58%)`;
}

/** Map a noise value [-1,1] to a percentage */
function pct(v: number): number {
  return ((v + 1) / 2) * 100;
}

// ---------------------------------------------------------------------------
// Coverage overview strip — thin bar showing all biome ranges overlaid
// ---------------------------------------------------------------------------
function CoverageStrip({
  ranges,
  selectedIndex,
  onSelect,
}: {
  ranges: { Biome: string; Min: number; Max: number }[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="relative h-6 bg-black/20 rounded overflow-hidden">
      {/* Axis gridlines */}
      {[-0.5, 0, 0.5].map((v) => (
        <div
          key={v}
          className="absolute top-0 bottom-0 w-px bg-white/[0.06]"
          style={{ left: `${pct(v)}%` }}
        />
      ))}
      {/* Biome bars */}
      {ranges.map((r, i) => {
        const left = pct(r.Min);
        const width = pct(r.Max) - left;
        const color = biomeColor(r.Biome);
        const isSel = i === selectedIndex;
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 cursor-pointer transition-opacity hover:opacity-100"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              minWidth: 3,
              backgroundColor: color,
              opacity: isSel ? 0.95 : 0.4,
              outline: isSel ? `2px solid ${color}` : undefined,
              outlineOffset: -1,
              zIndex: isSel ? 10 : undefined,
            }}
            onClick={() => onSelect(i)}
            title={`${r.Biome}  [${r.Min.toFixed(2)}, ${r.Max.toFixed(2)}]`}
          />
        );
      })}
      {/* Axis labels */}
      <span className="absolute left-1 top-0.5 text-[8px] text-white/30 pointer-events-none leading-none">-1</span>
      <span className="absolute right-1 top-0.5 text-[8px] text-white/30 pointer-events-none leading-none">1</span>
      <span className="absolute top-0.5 text-[8px] text-white/30 pointer-events-none leading-none" style={{ left: "50%", transform: "translateX(-50%)" }}>0</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline mini range bar for each list row
// ---------------------------------------------------------------------------
function MiniRangeBar({
  min,
  max,
  color,
  isSelected,
  onDragMin,
  onDragMax,
  onDragMove,
}: {
  min: number;
  max: number;
  color: string;
  isSelected: boolean;
  onDragMin: (delta: number) => void;
  onDragMax: (delta: number) => void;
  onDragMove: (delta: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent, mode: "min" | "max" | "move") => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const startX = e.clientX;

      const onMove = (ev: PointerEvent) => {
        if (!barRef.current) return;
        const barWidth = barRef.current.getBoundingClientRect().width;
        const dxPx = ev.clientX - startX;
        const dValue = (dxPx / barWidth) * 2; // bar represents -1 to 1 → width = 2
        if (mode === "min") onDragMin(dValue);
        else if (mode === "max") onDragMax(dValue);
        else onDragMove(dValue);
      };

      const onUp = (ev: PointerEvent) => {
        (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [onDragMin, onDragMax, onDragMove],
  );

  const left = pct(min);
  const width = pct(max) - left;
  const isNarrow = width < 3; // less than ~3% of bar

  return (
    <div ref={barRef} className="relative h-full bg-white/[0.04] rounded overflow-hidden">
      {/* Gridlines */}
      <div className="absolute top-0 bottom-0 w-px bg-white/[0.06]" style={{ left: "25%" }} />
      <div className="absolute top-0 bottom-0 w-px bg-white/[0.08]" style={{ left: "50%" }} />
      <div className="absolute top-0 bottom-0 w-px bg-white/[0.06]" style={{ left: "75%" }} />
      {/* Range bar — minWidth ensures narrow ranges are always grabbable */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-sm cursor-grab active:cursor-grabbing"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          minWidth: 14,
          backgroundColor: isNarrow ? `${color}88` : `${color}55`,
          border: isSelected ? `1.5px solid ${color}` : `1px solid ${color}`,
          boxShadow: isSelected
            ? `0 0 8px ${color}55`
            : isNarrow
              ? `0 0 4px ${color}44`
              : undefined,
        }}
        onPointerDown={(e) => startDrag(e, "move")}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-sm"
          onPointerDown={(e) => startDrag(e, "min")}
        />
        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-sm"
          onPointerDown={(e) => startDrag(e, "max")}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

export function BiomeRangeEditor() {
  const biomeRanges = useEditorStore((s) => s.biomeRanges);
  const updateBiomeRange = useEditorStore((s) => s.updateBiomeRange);
  const addBiomeRange = useEditorStore((s) => s.addBiomeRange);
  const removeBiomeRange = useEditorStore((s) => s.removeBiomeRange);
  const commitState = useEditorStore((s) => s.commitState);
  const setDirty = useProjectStore((s) => s.setDirty);
  const selectedBiomeIndex = useEditorStore((s) => s.selectedBiomeIndex);
  const setSelectedBiomeIndex = useEditorStore((s) => s.setSelectedBiomeIndex);
  const renameBiomeRange = useEditorStore((s) => s.renameBiomeRange);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("min");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingName, setEditingName] = useState<{ index: number; value: string } | null>(null);

  // Original index of drag start values (for committing after drag)
  const dragOrigRef = useRef<{ index: number; min: number; max: number } | null>(null);

  // Sorted + filtered indices
  const sortedIndices = useMemo(() => {
    const indices = biomeRanges.map((_, i) => i);

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filtered = indices.filter((i) => biomeRanges[i].Biome.toLowerCase().includes(q));
      return sortList(filtered);
    }
    return sortList(indices);

    function sortList(list: number[]) {
      return list.sort((a, b) => {
        const ra = biomeRanges[a];
        const rb = biomeRanges[b];
        let cmp = 0;
        if (sortKey === "name") cmp = ra.Biome.localeCompare(rb.Biome);
        else if (sortKey === "min") cmp = ra.Min - rb.Min;
        else if (sortKey === "max") cmp = ra.Max - rb.Max;
        else cmp = (ra.Max - ra.Min) - (rb.Max - rb.Min);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
  }, [biomeRanges, searchQuery, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const handleAddBiome = useCallback(() => {
    addBiomeRange({ Biome: "new_biome", Min: -0.25, Max: 0.25 });
  }, [addBiomeRange]);

  const handleRemove = useCallback(
    (index: number) => {
      removeBiomeRange(index);
    },
    [removeBiomeRange],
  );

  const handleSelect = useCallback(
    (index: number) => {
      setSelectedBiomeIndex(selectedBiomeIndex === index ? null : index);
    },
    [selectedBiomeIndex, setSelectedBiomeIndex],
  );

  const handleRenameCommit = useCallback(() => {
    if (editingName) {
      renameBiomeRange(editingName.index, editingName.value);
      setEditingName(null);
    }
  }, [editingName, renameBiomeRange]);

  // Drag callbacks — store original values on first drag event, commit on pointer up
  const makeDragHandler = useCallback(
    (index: number, mode: "min" | "max" | "move") => {
      return (delta: number) => {
        const range = biomeRanges[index];
        if (!dragOrigRef.current || dragOrigRef.current.index !== index) {
          dragOrigRef.current = { index, min: range.Min, max: range.Max };
        }
        const orig = dragOrigRef.current;
        let newMin = orig.min;
        let newMax = orig.max;

        if (mode === "move") {
          const w = orig.max - orig.min;
          newMin = Math.max(-1, Math.min(1 - w, orig.min + delta));
          newMax = newMin + w;
        } else if (mode === "min") {
          newMin = Math.max(-1, Math.min(orig.max - MIN_GAP, orig.min + delta));
        } else {
          newMax = Math.min(1, Math.max(orig.min + MIN_GAP, orig.max + delta));
        }
        updateBiomeRange(index, { Min: newMin, Max: newMax });
      };
    },
    [biomeRanges, updateBiomeRange],
  );

  // Global pointerup to commit drag
  const handlePointerUp = useCallback(() => {
    if (dragOrigRef.current) {
      dragOrigRef.current = null;
      commitState("Drag biome range");
      setDirty(true);
    }
  }, [commitState, setDirty]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <span className="ml-0.5 text-tn-accent">{sortDir === "asc" ? "\u25B4" : "\u25BE"}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-tn-surface border-b border-tn-border" onPointerUp={handlePointerUp}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-tn-border shrink-0">
        <span className="text-xs font-semibold text-tn-text shrink-0">Biome Ranges</span>
        <span className="text-[10px] text-tn-text-muted shrink-0">({biomeRanges.length})</span>

        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 max-w-[180px] h-5 px-1.5 text-[10px] bg-tn-surface-raised border border-tn-border rounded text-tn-text placeholder:text-tn-text-muted/50 focus:outline-none focus:border-tn-accent/50"
        />

        <button
          onClick={handleAddBiome}
          className="text-[10px] px-2 py-0.5 rounded bg-tn-accent/20 text-tn-accent hover:bg-tn-accent/30 transition-colors shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Coverage overview strip */}
      <div className="px-3 pt-1.5 pb-1 shrink-0">
        <CoverageStrip
          ranges={biomeRanges}
          selectedIndex={selectedBiomeIndex}
          onSelect={handleSelect}
        />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-1 px-3 py-0.5 border-b border-tn-border shrink-0 text-[9px] text-tn-text-muted uppercase tracking-wider">
        <div className="w-3 shrink-0" />
        <button
          className="w-[140px] shrink-0 text-left hover:text-tn-text transition-colors flex items-center"
          onClick={() => handleSort("name")}
        >
          Name{sortIndicator("name")}
        </button>
        <div className="flex-1 text-center">Range</div>
        <button
          className="w-12 shrink-0 text-right hover:text-tn-text transition-colors flex items-center justify-end"
          onClick={() => handleSort("min")}
        >
          Min{sortIndicator("min")}
        </button>
        <button
          className="w-12 shrink-0 text-right hover:text-tn-text transition-colors flex items-center justify-end"
          onClick={() => handleSort("max")}
        >
          Max{sortIndicator("max")}
        </button>
        <button
          className="w-10 shrink-0 text-right hover:text-tn-text transition-colors flex items-center justify-end"
          onClick={() => handleSort("width")}
        >
          W{sortIndicator("width")}
        </button>
        <div className="w-5 shrink-0" />
      </div>

      {/* Scrollable biome list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div style={{ height: sortedIndices.length * ROW_H }}>
          {sortedIndices.map((origIdx) => {
            const range = biomeRanges[origIdx];
            if (!range) return null;
            const color = biomeColor(range.Biome);
            const isSel = selectedBiomeIndex === origIdx;
            const isEditing = editingName?.index === origIdx;

            return (
              <div
                key={origIdx}
                className={`flex items-center gap-1 px-3 border-b border-white/[0.03] cursor-pointer transition-colors ${
                  isSel ? "bg-tn-accent/[0.08]" : "hover:bg-white/[0.02]"
                }`}
                style={{ height: ROW_H }}
                onClick={() => handleSelect(origIdx)}
              >
                {/* Color swatch */}
                <div
                  className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Name */}
                <div className="w-[140px] shrink-0 min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName.value}
                      onChange={(e) => setEditingName({ index: origIdx, value: e.target.value })}
                      onBlur={handleRenameCommit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCommit();
                        if (e.key === "Escape") setEditingName(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-5 px-1 text-[10px] bg-tn-surface border border-tn-accent/50 rounded text-tn-text focus:outline-none"
                    />
                  ) : (
                    <span
                      className="block text-[10px] text-tn-text truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingName({ index: origIdx, value: range.Biome });
                      }}
                      title={range.Biome}
                    >
                      {range.Biome}
                    </span>
                  )}
                </div>

                {/* Mini range bar */}
                <div className="flex-1 h-3.5 min-w-0">
                  <MiniRangeBar
                    min={range.Min}
                    max={range.Max}
                    color={color}
                    isSelected={isSel}
                    onDragMin={makeDragHandler(origIdx, "min")}
                    onDragMax={makeDragHandler(origIdx, "max")}
                    onDragMove={makeDragHandler(origIdx, "move")}
                  />
                </div>

                {/* Min value */}
                <input
                  type="number"
                  step={0.01}
                  value={range.Min.toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) updateBiomeRange(origIdx, { Min: Math.max(-1, Math.min(range.Max - MIN_GAP, v)) });
                  }}
                  onBlur={() => { commitState("Edit biome min"); setDirty(true); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 shrink-0 h-5 px-0.5 text-[10px] text-right bg-transparent border border-transparent hover:border-tn-border focus:border-tn-accent/50 rounded text-tn-text-muted focus:text-tn-text tabular-nums focus:outline-none"
                />

                {/* Max value */}
                <input
                  type="number"
                  step={0.01}
                  value={range.Max.toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) updateBiomeRange(origIdx, { Max: Math.min(1, Math.max(range.Min + MIN_GAP, v)) });
                  }}
                  onBlur={() => { commitState("Edit biome max"); setDirty(true); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-12 shrink-0 h-5 px-0.5 text-[10px] text-right bg-transparent border border-transparent hover:border-tn-border focus:border-tn-accent/50 rounded text-tn-text-muted focus:text-tn-text tabular-nums focus:outline-none"
                />

                {/* Width display */}
                <span className="w-10 shrink-0 text-[9px] text-tn-text-muted/60 text-right tabular-nums">
                  {(range.Max - range.Min).toFixed(2)}
                </span>

                {/* Delete */}
                <button
                  className="w-5 shrink-0 h-5 flex items-center justify-center text-[10px] text-tn-text-muted/40 hover:text-red-400 transition-colors rounded"
                  onClick={(e) => { e.stopPropagation(); handleRemove(origIdx); }}
                  title="Remove"
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
