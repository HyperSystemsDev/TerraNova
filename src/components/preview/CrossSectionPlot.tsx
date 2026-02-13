import { useCallback, useEffect, useRef, useState } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { sampleCrossSection, type CrossSectionSample } from "@/utils/crossSection";

export function CrossSectionPlot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const crossSectionLine = usePreviewStore((s) => s.crossSectionLine);
  const values = usePreviewStore((s) => s.values);
  const resolution = usePreviewStore((s) => s.resolution);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const [hover, setHover] = useState<{ x: number; y: number; sample: CrossSectionSample } | null>(null);
  const samplesRef = useRef<CrossSectionSample[]>([]);

  // Compute samples
  const samples = (() => {
    if (!crossSectionLine || !values) return [];
    return sampleCrossSection(values, resolution, rangeMin, rangeMax, crossSectionLine.start, crossSectionLine.end);
  })();
  samplesRef.current = samples;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length === 0) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = 120 * window.devicePixelRatio;
    }

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const dw = w / window.devicePixelRatio;
    const dh = h / window.devicePixelRatio;

    ctx.clearRect(0, 0, dw, dh);

    const padding = { top: 8, right: 12, bottom: 20, left: 40 };
    const plotW = dw - padding.left - padding.right;
    const plotH = dh - padding.top - padding.bottom;

    // Compute value range
    let vMin = samples[0].value;
    let vMax = samples[0].value;
    const maxDist = samples[samples.length - 1].distance;
    for (const s of samples) {
      if (s.value < vMin) vMin = s.value;
      if (s.value > vMax) vMax = s.value;
    }
    const vRange = vMax - vMin || 1;

    // Grid lines
    ctx.strokeStyle = "#ffffff15";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();
    }

    // Axes labels
    ctx.fillStyle = "#888";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * plotH;
      const val = vMax - (i / 4) * vRange;
      ctx.fillText(val.toFixed(2), padding.left - 4, y + 3);
    }
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (i / 4) * plotW;
      const dist = (i / 4) * maxDist;
      ctx.fillText(dist.toFixed(0), x, dh - 4);
    }

    // Plot line
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = padding.left + (samples[i].distance / maxDist) * plotW;
      const y = padding.top + (1 - (samples[i].value - vMin) / vRange) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [samples]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || samplesRef.current.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padding = { left: 40, right: 12 };
      const plotW = rect.width - padding.left - padding.right;
      const maxDist = samplesRef.current[samplesRef.current.length - 1].distance;
      const dist = ((x - padding.left) / plotW) * maxDist;

      // Find nearest sample
      let best = samplesRef.current[0];
      let bestDist = Math.abs(best.distance - dist);
      for (const s of samplesRef.current) {
        const d = Math.abs(s.distance - dist);
        if (d < bestDist) {
          best = s;
          bestDist = d;
        }
      }

      setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, sample: best });
    },
    [],
  );

  if (!crossSectionLine || !values || samples.length === 0) return null;

  return (
    <div ref={containerRef} className="relative w-full h-[120px] border-t border-tn-border bg-tn-bg">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover && (
        <div
          className="absolute pointer-events-none px-1.5 py-0.5 bg-tn-panel/95 border border-tn-border rounded text-[9px] text-tn-text font-mono z-10"
          style={{ left: Math.min(hover.x, containerRef.current!.clientWidth - 120), top: Math.max(0, hover.y - 28) }}
        >
          d={hover.sample.distance.toFixed(1)} val={hover.sample.value.toFixed(4)}
        </div>
      )}
    </div>
  );
}
