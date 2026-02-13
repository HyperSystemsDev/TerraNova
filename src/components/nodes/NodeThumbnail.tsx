import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { usePreviewStore } from "@/stores/previewStore";
import { evaluateDensityGrid } from "@/utils/densityEvaluator";
import { getColormap } from "@/utils/colormaps";

const GRID = 8;
const DISPLAY = 64;
const RANGE_MIN = -32;
const RANGE_MAX = 32;
const Y_LEVEL = 64;

interface NodeThumbnailProps {
  nodeId: string;
}

export function NodeThumbnail({ nodeId }: NodeThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visibleRef.current) return;

    const schedule = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback
      : (cb: () => void) => requestAnimationFrame(cb);

    schedule(() => {
      const { nodes, edges, contentFields } = useEditorStore.getState();
      const colormapId = usePreviewStore.getState().colormap;
      const colormap = getColormap(colormapId);

      try {
        const { values, minValue, maxValue } = evaluateDensityGrid(
          nodes, edges, GRID, RANGE_MIN, RANGE_MAX, Y_LEVEL, nodeId,
          { contentFields },
        );

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const imageData = ctx.createImageData(DISPLAY, DISPLAY);
        const range = maxValue - minValue || 1;
        const scale = DISPLAY / GRID;

        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const t = (values[gy * GRID + gx] - minValue) / range;
            const [r, g, b] = colormap.ramp(t);

            // Upscale: fill the block of pixels
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                const px = gx * scale + dx;
                const py = gy * scale + dy;
                const idx = (py * DISPLAY + px) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = 255;
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      } catch {
        // Evaluation failure — clear to transparent
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, DISPLAY, DISPLAY);
      }
    });
  }, [nodeId]);

  // Debounced re-render when nodes/edges/colormap change
  useEffect(() => {
    function scheduleRender() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(render, 300);
    }

    const unsubEditor = useEditorStore.subscribe((state, prevState) => {
      if (state.nodes !== prevState.nodes || state.edges !== prevState.edges) {
        scheduleRender();
      }
    });

    const unsubPreview = usePreviewStore.subscribe((state, prevState) => {
      if (state.colormap !== prevState.colormap) {
        scheduleRender();
      }
    });

    return () => {
      unsubEditor();
      unsubPreview();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [render]);

  // IntersectionObserver for viewport culling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visibleRef.current;
        visibleRef.current = entry.isIntersecting;
        // Render when becoming visible
        if (!wasVisible && entry.isIntersecting) {
          render();
        }
      },
      { threshold: 0 },
    );

    observerRef.current.observe(canvas);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={DISPLAY}
      height={DISPLAY}
      style={{
        width: DISPLAY,
        height: DISPLAY,
        imageRendering: "pixelated",
        borderRadius: 4,
      }}
    />
  );
}
