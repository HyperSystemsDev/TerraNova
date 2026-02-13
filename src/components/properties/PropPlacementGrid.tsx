import { useEffect, useRef, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import { usePropPlacementStore } from "@/stores/propPlacementStore";
import type { WorldRange } from "@/utils/positionEvaluator";

interface PropPlacementGridProps {
  nodes: Node[];
  edges: Edge[];
  /** Optional: evaluate from a specific node instead of auto-detecting the root */
  rootNodeId?: string;
}

const CANVAS_SIZE = 300;
const BG_COLOR = "#1c1a17";
const GRID_COLOR = "rgba(74,68,56,0.3)";
const AXIS_COLOR = "rgba(74,68,56,0.6)";
const DOT_COLOR_R = 107;
const DOT_COLOR_G = 158;
const DOT_COLOR_B = 90;
const DOT_RADIUS = 2.5;
const GRID_INTERVAL = 16;

const RANGE_OPTIONS: { label: string; half: number }[] = [
  { label: "\u00b132", half: 32 },
  { label: "\u00b164", half: 64 },
  { label: "\u00b1128", half: 128 },
  { label: "\u00b1256", half: 256 },
];

export function PropPlacementGrid({ nodes, edges, rootNodeId }: PropPlacementGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const worldRange = usePropPlacementStore((s) => s.worldRange);
  const showGrid = usePropPlacementStore((s) => s.showGrid);
  const showDensityOverlay = usePropPlacementStore((s) => s.showDensityOverlay);
  const seed = usePropPlacementStore((s) => s.seed);
  const positions = usePropPlacementStore((s) => s.positions);
  const positionCount = usePropPlacementStore((s) => s.positionCount);
  const evaluationError = usePropPlacementStore((s) => s.evaluationError);

  const setWorldRange = usePropPlacementStore((s) => s.setWorldRange);
  const setShowGrid = usePropPlacementStore((s) => s.setShowGrid);
  const setShowDensityOverlay = usePropPlacementStore((s) => s.setShowDensityOverlay);
  const setSeed = usePropPlacementStore((s) => s.setSeed);
  const evaluate = usePropPlacementStore((s) => s.evaluate);
  // const reset = usePropPlacementStore((s) => s.reset);

  // Auto-evaluate with debounce — clear stale positions immediately on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    usePropPlacementStore.setState({ positions: [], positionCount: 0 });
    debounceRef.current = setTimeout(() => {
      evaluate(nodes, edges, rootNodeId);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, edges, worldRange, seed, rootNodeId, evaluate]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    const w = CANVAS_SIZE;
    const h = CANVAS_SIZE;
    const { minX, maxX, minZ, maxZ } = worldRange;
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    if (showGrid) {
      ctx.lineWidth = 1;

      for (let wx = Math.ceil(minX / GRID_INTERVAL) * GRID_INTERVAL; wx <= maxX; wx += GRID_INTERVAL) {
        const px = ((wx - minX) / rangeX) * w;
        ctx.strokeStyle = wx === 0 ? AXIS_COLOR : GRID_COLOR;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }

      for (let wz = Math.ceil(minZ / GRID_INTERVAL) * GRID_INTERVAL; wz <= maxZ; wz += GRID_INTERVAL) {
        const py = ((wz - minZ) / rangeZ) * h;
        ctx.strokeStyle = wz === 0 ? AXIS_COLOR : GRID_COLOR;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();
      }
    }

    // Density overlay
    if (showDensityOverlay && positions.length > 0) {
      const cellCount = 16;
      const cellW = w / cellCount;
      const cellH = h / cellCount;
      const counts = new Float32Array(cellCount * cellCount);
      let maxCount = 0;

      for (const pos of positions) {
        const cx = Math.floor(((pos.x - minX) / rangeX) * cellCount);
        const cz = Math.floor(((pos.z - minZ) / rangeZ) * cellCount);
        if (cx >= 0 && cx < cellCount && cz >= 0 && cz < cellCount) {
          const idx = cz * cellCount + cx;
          counts[idx] += pos.weight;
          if (counts[idx] > maxCount) maxCount = counts[idx];
        }
      }

      if (maxCount > 0) {
        for (let cz = 0; cz < cellCount; cz++) {
          for (let cx = 0; cx < cellCount; cx++) {
            const density = counts[cz * cellCount + cx] / maxCount;
            if (density > 0) {
              ctx.fillStyle = `rgba(${DOT_COLOR_R},${DOT_COLOR_G},${DOT_COLOR_B},${density * 0.4})`;
              ctx.fillRect(cx * cellW, cz * cellH, cellW, cellH);
            }
          }
        }
      }
    }

    // Position dots
    for (const pos of positions) {
      const px = ((pos.x - minX) / rangeX) * w;
      const pz = ((pos.z - minZ) / rangeZ) * h;

      if (px < -DOT_RADIUS || px > w + DOT_RADIUS || pz < -DOT_RADIUS || pz > h + DOT_RADIUS) continue;

      const alpha = 0.3 + 0.7 * pos.weight;
      ctx.fillStyle = `rgba(${DOT_COLOR_R},${DOT_COLOR_G},${DOT_COLOR_B},${alpha})`;
      ctx.beginPath();
      ctx.arc(px, pz, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = "#9a9082";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${minX}`, 2, h - 3);
    ctx.textAlign = "right";
    ctx.fillText(`${maxX}`, w - 2, h - 3);
    ctx.textAlign = "left";
    ctx.fillText(`${minZ}`, 2, 10);
    ctx.textAlign = "right";
    ctx.fillText(`${maxZ}`, w - 2, 10);
  }, [positions, worldRange, showGrid, showDensityOverlay]);

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const half = parseInt(e.target.value, 10);
      const range: WorldRange = { minX: -half, maxX: half, minZ: -half, maxZ: half };
      setWorldRange(range);
    },
    [setWorldRange],
  );

  const handleSeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) setSeed(val);
    },
    [setSeed],
  );

  const handleReseed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 100000));
  }, [setSeed]);

  const currentHalf = (worldRange.maxX - worldRange.minX) / 2;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-tn-text-muted">Placement Preview</h4>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <label className="flex items-center gap-1 text-tn-text-muted">
          Range:
          <select
            value={currentHalf}
            onChange={handleRangeChange}
            className="bg-tn-bg border border-tn-border rounded px-1 py-0.5 text-tn-text text-[10px]"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.half} value={opt.half}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-tn-text-muted">
          Seed:
          <input
            type="number"
            value={seed}
            onChange={handleSeedChange}
            className="bg-tn-bg border border-tn-border rounded px-1 py-0.5 text-tn-text text-[10px] w-12"
          />
        </label>

        <label className="flex items-center gap-1 text-tn-text-muted">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="accent-[#6B9E5A]"
          />
          Grid
        </label>

        <label className="flex items-center gap-1 text-tn-text-muted">
          <input
            type="checkbox"
            checked={showDensityOverlay}
            onChange={(e) => setShowDensityOverlay(e.target.checked)}
            className="accent-[#6B9E5A]"
          />
          Density
        </label>

        <button
          onClick={handleReseed}
          className="text-tn-text-muted hover:text-tn-text px-1"
          title="Randomize seed"
        >
          &#x21bb;
        </button>

        <span className="text-tn-text-muted ml-auto">
          {positionCount.toLocaleString()} positions
        </span>
      </div>

      {/* Error display */}
      {evaluationError && (
        <div className="text-[10px] text-red-400 bg-red-400/10 rounded px-2 py-1">
          {evaluationError}
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          imageRendering: "auto",
        }}
        className="border border-tn-border rounded"
      />
    </div>
  );
}
