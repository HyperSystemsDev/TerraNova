import { useRef, useEffect, useCallback, useState } from "react";
import {
  normalizePoints,
  toOutputFormat,
  catmullRomInterpolate,
  clamp01,
  CURVE_PRESETS,
  type NormalizedPoint,
} from "@/utils/curveEvaluators";

const PADDING = 16;
const CANVAS_HEIGHT = 200;
const BG_COLOR = "#1c1a17";
const GRID_COLOR = "#312d28";
const BORDER_COLOR = "#4a4438";
const LABEL_COLOR = "#9a9082";
const CURVE_COLOR = "#A67EB8";
const CURVE_FILL = "#A67EB820";
const HOVER_COLOR = "#BF96CC";
const POINT_RADIUS = 5;
const HOVER_RADIUS = 6;
const DRAG_RADIUS = 7;
const HIT_RADIUS = 12;
const CROSSHAIR_COLOR = "#e8e2d930";
const SNAP_GRID = 0.25;
const SNAP_GRID_HIGHLIGHT = "#5a5347";
const BOUNDS_PADDING_FACTOR = 0.1;

interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface DragState {
  index: number;
  origIndex: number;
}

interface CurveCanvasProps {
  points?: unknown[];
  onChange?: (points: [number, number][]) => void;
  onCommit?: () => void;
  evaluator?: (x: number) => number;
  label?: string;
  compact?: boolean;
}

/** Compute viewport bounds from points with 10% padding. Defaults to [0,1] when all points fit. */
function computeBounds(points: NormalizedPoint[]): Bounds {
  if (points.length === 0) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // If all points fit within [0,1], keep the standard viewport
  if (minX >= 0 && maxX <= 1 && minY >= 0 && maxY <= 1) {
    return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
  }

  // Add 10% padding on each side
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;
  const xPad = xRange * BOUNDS_PADDING_FACTOR;
  const yPad = yRange * BOUNDS_PADDING_FACTOR;

  return {
    xMin: minX - xPad,
    xMax: maxX + xPad,
    yMin: minY - yPad,
    yMax: maxY + yPad,
  };
}

/** Compute a nice grid interval that produces ~4 grid lines for a given range. */
function niceGridInterval(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 0.25;
  const rough = range / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2.5) nice = 2.5;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

/** Format axis label with appropriate decimal places based on magnitude. */
function formatAxisLabel(v: number): string {
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  if (abs >= 1) return v.toFixed(2);
  return v.toFixed(3);
}

const snapToGrid = (v: number, interval: number = SNAP_GRID) =>
  Math.round(v / interval) * interval;

export function CurveCanvas({ points, onChange, onCommit, evaluator, label, compact }: CurveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<NormalizedPoint[]>([]);
  const dragRef = useRef<DragState | null>(null);
  const hoverIndexRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: compact ? 40 : CANVAS_HEIGHT });
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const shiftHeldRef = useRef(false);
  const boundsRef = useRef<Bounds>({ xMin: 0, xMax: 1, yMin: 0, yMax: 1 });
  const [bounds, setBounds] = useState<Bounds>({ xMin: 0, xMax: 1, yMin: 0, yMax: 1 });

  const isInteractive = !!onChange && !compact;
  const canvasHeight = compact ? 40 : CANVAS_HEIGHT;
  const padding = compact ? 4 : PADDING;

  // Keep pointsRef in sync with props and recompute bounds on load/import
  useEffect(() => {
    const normalized = points ? normalizePoints(points as unknown[]) : [];
    pointsRef.current = normalized;
    if (!dragRef.current) {
      const newBounds = computeBounds(normalized);
      boundsRef.current = newBounds;
      setBounds(newBounds);
    }
  }, [points]);

  // Coordinate conversions — map [xMin,xMax] / [yMin,yMax] to pixel space
  const toCanvasX = useCallback((vx: number) => {
    const { xMin, xMax } = boundsRef.current;
    const range = xMax - xMin || 1;
    return padding + ((vx - xMin) / range) * (sizeRef.current.w - padding * 2);
  }, [padding]);

  const toCanvasY = useCallback((vy: number) => {
    const { yMin, yMax } = boundsRef.current;
    const range = yMax - yMin || 1;
    return padding + (1 - (vy - yMin) / range) * (canvasHeight - padding * 2);
  }, [padding, canvasHeight]);

  const fromCanvasX = useCallback((cx: number) => {
    const { xMin, xMax } = boundsRef.current;
    const pixelRange = sizeRef.current.w - padding * 2;
    if (pixelRange <= 0) return xMin;
    return xMin + ((cx - padding) / pixelRange) * (xMax - xMin);
  }, [padding]);

  const fromCanvasY = useCallback((cy: number) => {
    const { yMin, yMax } = boundsRef.current;
    const pixelRange = canvasHeight - padding * 2;
    if (pixelRange <= 0) return yMin;
    return yMin + (1 - (cy - padding) / pixelRange) * (yMax - yMin);
  }, [padding, canvasHeight]);

  // -----------------------------------------------------------------------
  // Draw
  // -----------------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = sizeRef.current.w;
    const h = canvasHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    if (!compact) {
      const { xMin, xMax, yMin, yMax } = boundsRef.current;
      const xInterval = niceGridInterval(xMin, xMax);
      const yInterval = niceGridInterval(yMin, yMax);

      // Grid lines — dynamic intervals
      const isSnapping = shiftHeldRef.current && dragRef.current;
      ctx.strokeStyle = isSnapping ? SNAP_GRID_HIGHLIGHT : GRID_COLOR;
      ctx.lineWidth = isSnapping ? 1 : 0.5;

      // X grid lines
      const xStart = Math.ceil(xMin / xInterval) * xInterval;
      for (let v = xStart; v <= xMax; v += xInterval) {
        const cx = toCanvasX(v);
        if (cx >= padding && cx <= w - padding) {
          ctx.beginPath();
          ctx.moveTo(cx, padding);
          ctx.lineTo(cx, h - padding);
          ctx.stroke();
        }
      }

      // Y grid lines
      const yStart = Math.ceil(yMin / yInterval) * yInterval;
      for (let v = yStart; v <= yMax; v += yInterval) {
        const cy = toCanvasY(v);
        if (cy >= padding && cy <= h - padding) {
          ctx.beginPath();
          ctx.moveTo(padding, cy);
          ctx.lineTo(w - padding, cy);
          ctx.stroke();
        }
      }

      // Axis border
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

      // Axis labels
      ctx.fillStyle = LABEL_COLOR;
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";

      // X axis labels (bottom)
      for (let v = xStart; v <= xMax; v += xInterval) {
        const cx = toCanvasX(v);
        if (cx >= padding && cx <= w - padding) {
          ctx.fillText(formatAxisLabel(v), cx, h - 2);
        }
      }

      // Y axis labels (left)
      ctx.textAlign = "right";
      for (let v = yStart; v <= yMax; v += yInterval) {
        const cy = toCanvasY(v);
        if (cy >= padding && cy <= h - padding) {
          ctx.fillText(formatAxisLabel(v), padding - 3, cy + 3);
        }
      }
    }

    // Build curve points to render
    let curvePoints: NormalizedPoint[];
    if (evaluator) {
      // Computed curve: sample at 100 points
      curvePoints = [];
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        curvePoints.push({ x, y: clamp01(evaluator(x)) });
      }
    } else {
      // Manual: sort by X, apply Catmull-Rom smooth interpolation
      const sorted = [...pointsRef.current].sort((a, b) => a.x - b.x);
      curvePoints = sorted.length >= 2 ? catmullRomInterpolate(sorted) : sorted;
    }

    if (curvePoints.length > 0) {
      const { yMin } = boundsRef.current;

      // Fill under curve
      ctx.beginPath();
      ctx.moveTo(toCanvasX(curvePoints[0].x), toCanvasY(yMin));
      for (const p of curvePoints) {
        ctx.lineTo(toCanvasX(p.x), toCanvasY(p.y));
      }
      ctx.lineTo(toCanvasX(curvePoints[curvePoints.length - 1].x), toCanvasY(yMin));
      ctx.closePath();
      ctx.fillStyle = CURVE_FILL;
      ctx.fill();

      // Curve stroke
      ctx.beginPath();
      ctx.moveTo(toCanvasX(curvePoints[0].x), toCanvasY(curvePoints[0].y));
      for (let i = 1; i < curvePoints.length; i++) {
        ctx.lineTo(toCanvasX(curvePoints[i].x), toCanvasY(curvePoints[i].y));
      }
      ctx.strokeStyle = CURVE_COLOR;
      ctx.lineWidth = compact ? 1.5 : 2;
      ctx.stroke();
    }

    // Control points (interactive mode only)
    if (isInteractive) {
      const sorted = [...pointsRef.current].sort((a, b) => a.x - b.x);
      const drag = dragRef.current;
      const hoverIdx = hoverIndexRef.current;

      for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(p.y);

        let radius = POINT_RADIUS;
        let fill = CURVE_COLOR;
        let stroke = "#ffffff";
        let strokeWidth = 2;

        if (drag && drag.index === i) {
          radius = DRAG_RADIUS;
          fill = "#ffffff";
          stroke = CURVE_COLOR;
          strokeWidth = 2;
        } else if (hoverIdx === i) {
          radius = HOVER_RADIUS;
          fill = HOVER_COLOR;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        // Tooltip on drag
        if (drag && drag.index === i) {
          const txt = `(${p.x.toFixed(4)}, ${p.y.toFixed(4)})`;
          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(txt, cx, cy - DRAG_RADIUS - 6);
        }
      }

      // Crosshair + coordinate readout
      const cursor = cursorPosRef.current;
      if (cursor && !drag) {
        const cursorCX = toCanvasX(cursor.x);
        const cursorCY = toCanvasY(cursor.y);

        // Dashed crosshair lines
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = CROSSHAIR_COLOR;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cursorCX, padding);
        ctx.lineTo(cursorCX, h - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, cursorCY);
        ctx.lineTo(w - padding, cursorCY);
        ctx.stroke();
        ctx.restore();

        // Coordinate readout
        const readout = `X: ${cursor.x.toFixed(4)}  Y: ${cursor.y.toFixed(4)}`;
        ctx.font = "10px monospace";
        ctx.fillStyle = "#ffffffa0";
        ctx.textAlign = "left";
        ctx.fillText(readout, padding + 4, padding + 12);
      }
    }

    // Read-only label overlay
    if (!isInteractive && label && !compact) {
      ctx.fillStyle = LABEL_COLOR;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(label, w - padding - 4, padding + 14);
    }
  }, [evaluator, isInteractive, label, compact, canvasHeight, padding, toCanvasX, toCanvasY]);

  // Redraw coalesced via rAF
  const requestDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }, [draw]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        sizeRef.current.w = entry.contentRect.width;
      }
      requestDraw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [requestDraw]);

  // Redraw when points or evaluator changes
  useEffect(() => {
    requestDraw();
  }, [points, evaluator, requestDraw]);

  // -----------------------------------------------------------------------
  // Hit test: find closest point within HIT_RADIUS
  // -----------------------------------------------------------------------
  const hitTest = useCallback(
    (cx: number, cy: number): number => {
      const sorted = [...pointsRef.current].sort((a, b) => a.x - b.x);
      let bestIdx = -1;
      let bestDist = HIT_RADIUS * HIT_RADIUS;
      for (let i = 0; i < sorted.length; i++) {
        const px = toCanvasX(sorted[i].x);
        const py = toCanvasY(sorted[i].y);
        const dx = cx - px;
        const dy = cy - py;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = i;
        }
      }
      return bestIdx;
    },
    [toCanvasX, toCanvasY],
  );

  // -----------------------------------------------------------------------
  // Pointer handlers
  // -----------------------------------------------------------------------
  const emitChange = useCallback(() => {
    if (!onChange) return;
    onChange(toOutputFormat(pointsRef.current));
  }, [onChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isInteractive) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const idx = hitTest(cx, cy);
      if (idx < 0) return;

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const sorted = [...pointsRef.current].sort((a, b) => a.x - b.x);
      // Use object reference identity to find the original index
      const origIndex = pointsRef.current.indexOf(sorted[idx]);
      dragRef.current = { index: idx, origIndex };
      shiftHeldRef.current = e.shiftKey;
      requestDraw();
    },
    [isInteractive, hitTest, requestDraw],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isInteractive) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (dragRef.current) {
        const drag = dragRef.current;
        const { xMin, xMax, yMin, yMax } = boundsRef.current;
        shiftHeldRef.current = e.shiftKey;

        let newX = Math.max(xMin, Math.min(xMax, fromCanvasX(cx)));
        let newY = Math.max(yMin, Math.min(yMax, fromCanvasY(cy)));

        // Snap to grid with Shift — use dynamic interval for wide-range curves
        if (e.shiftKey) {
          const xInterval = niceGridInterval(xMin, xMax);
          const yInterval = niceGridInterval(yMin, yMax);
          newX = Math.max(xMin, Math.min(xMax, snapToGrid(newX, xInterval)));
          newY = Math.max(yMin, Math.min(yMax, snapToGrid(newY, yInterval)));
        }

        // Directly update using stored origIndex
        pointsRef.current[drag.origIndex] = { x: newX, y: newY };

        emitChange();
      } else {
        // Update cursor position for crosshair readout
        const vx = fromCanvasX(cx);
        const vy = fromCanvasY(cy);
        cursorPosRef.current = { x: vx, y: vy };

        // Hover detection
        const newHover = hitTest(cx, cy);
        if (newHover !== hoverIndexRef.current) {
          hoverIndexRef.current = newHover;
          canvasRef.current!.style.cursor = newHover >= 0 ? "grab" : "default";
        }
      }
      requestDraw();
    },
    [isInteractive, fromCanvasX, fromCanvasY, hitTest, emitChange, requestDraw],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current = null;
      shiftHeldRef.current = false;
      emitChange();
      onCommit?.();
      requestDraw();
    },
    [emitChange, onCommit, requestDraw],
  );

  const handlePointerLeave = useCallback(() => {
    cursorPosRef.current = null;
    requestDraw();
  }, [requestDraw]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isInteractive) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const { xMin, xMax, yMin, yMax } = boundsRef.current;
      let x = Math.max(xMin, Math.min(xMax, fromCanvasX(e.clientX - rect.left)));
      let y = Math.max(yMin, Math.min(yMax, fromCanvasY(e.clientY - rect.top)));
      if (e.shiftKey) {
        const xInterval = niceGridInterval(xMin, xMax);
        const yInterval = niceGridInterval(yMin, yMax);
        x = Math.max(xMin, Math.min(xMax, snapToGrid(x, xInterval)));
        y = Math.max(yMin, Math.min(yMax, snapToGrid(y, yInterval)));
      }
      pointsRef.current = [...pointsRef.current, { x, y }];
      emitChange();
      onCommit?.();
      requestDraw();
    },
    [isInteractive, fromCanvasX, fromCanvasY, emitChange, onCommit, requestDraw],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isInteractive) return;
      e.preventDefault();
      const rect = canvasRef.current!.getBoundingClientRect();
      const idx = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (idx < 0) return;

      const sorted = [...pointsRef.current].sort((a, b) => a.x - b.x);
      // Use object reference identity to find the original index
      const origIndex = pointsRef.current.indexOf(sorted[idx]);
      if (origIndex >= 0) {
        pointsRef.current = pointsRef.current.filter((_, i) => i !== origIndex);
      }
      emitChange();
      onCommit?.();
      requestDraw();
    },
    [isInteractive, hitTest, emitChange, onCommit, requestDraw],
  );

  const applyPreset = useCallback(
    (name: string) => {
      if (!onChange) return;
      onChange(CURVE_PRESETS[name]);
      onCommit?.();
    },
    [onChange, onCommit],
  );

  const fitBounds = useCallback(() => {
    const newBounds = computeBounds(pointsRef.current);
    boundsRef.current = newBounds;
    setBounds(newBounds);
    requestDraw();
  }, [requestDraw]);

  const updateBound = useCallback((key: keyof Bounds, value: number) => {
    if (isNaN(value)) return;
    setBounds(prev => {
      const next = { ...prev, [key]: value };
      boundsRef.current = next;
      return next;
    });
    requestDraw();
  }, [requestDraw]);

  if (compact) {
    return (
      <div ref={containerRef} style={{ width: "100%", height: 40 }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label && isInteractive && (
        <span className="text-xs text-tn-text-muted">{label}</span>
      )}
      {isInteractive && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-tn-text-muted mr-1">Presets:</span>
          {Object.keys(CURVE_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-tn-bg-secondary hover:bg-tn-bg-tertiary text-tn-text-secondary transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
      </div>
      {isInteractive && (
        <p className="text-[10px] text-tn-text-muted">
          Drag to move | Double-click to add | Right-click to remove | Shift = snap
        </p>
      )}
      {isInteractive && (
        <div className="flex items-center gap-1.5 text-[10px] text-tn-text-muted flex-wrap">
          <span>Bounds:</span>
          <span className="flex items-center gap-0.5">
            X
            <input type="number" step="0.1"
              value={bounds.xMin}
              onChange={e => updateBound('xMin', e.target.valueAsNumber)}
              className="w-14 px-1 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text text-[10px]"
            />
            <span>to</span>
            <input type="number" step="0.1"
              value={bounds.xMax}
              onChange={e => updateBound('xMax', e.target.valueAsNumber)}
              className="w-14 px-1 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text text-[10px]"
            />
          </span>
          <span className="flex items-center gap-0.5">
            Y
            <input type="number" step="0.1"
              value={bounds.yMin}
              onChange={e => updateBound('yMin', e.target.valueAsNumber)}
              className="w-14 px-1 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text text-[10px]"
            />
            <span>to</span>
            <input type="number" step="0.1"
              value={bounds.yMax}
              onChange={e => updateBound('yMax', e.target.valueAsNumber)}
              className="w-14 px-1 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text text-[10px]"
            />
          </span>
          <button type="button" onClick={fitBounds}
            className="text-[10px] px-1.5 py-0.5 rounded bg-tn-bg-secondary hover:bg-tn-bg-tertiary text-tn-text-secondary transition-colors"
          >
            Fit
          </button>
        </div>
      )}
    </div>
  );
}
