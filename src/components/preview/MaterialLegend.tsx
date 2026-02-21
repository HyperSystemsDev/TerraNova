import type { VoxelMaterial } from "@/utils/voxelExtractor";
import { useRef, useCallback, useEffect } from "react";
import FloatingBox from "@/components/common/FloatingBox";
import { useUIStore } from "@/stores/uiStore";

type Props = { materials: VoxelMaterial[] };

/**
 * MaterialLegend
 * - Anchored bottom-right by default
 * - Clicks do not bubble to global overlays
 * - Drag-to-float uses pointer events and persists an initial floating position
 * - Detach button clears dock assignment before floating
 */
export function MaterialLegend({ materials }: Props) {
  const floating = useUIStore((s) => s.floatingMaterialsLegend);
  const setFloating = useUIStore((s) => s.setFloatingMaterialsLegend);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const detach = useCallback((evt?: MouseEvent) => {
    try { useUIStore.getState().setDockAssignment("materials-legend", null); } catch {}

    // Persist an initial floating position so the FloatingBox appears on-screen
    try {
      if (evt) {
        const px = Math.max(8, evt.clientX - 120);
        const py = Math.max(8, evt.clientY - 20);
        localStorage.setItem("tn-materials-legend-pos", JSON.stringify({ x: px, y: py }));
        localStorage.removeItem("tn-materials-legend-anchor");
      } else {
        const px = Math.max(8, window.innerWidth - 260);
        const py = Math.max(8, window.innerHeight - 160);
        localStorage.setItem("tn-materials-legend-pos", JSON.stringify({ x: px, y: py }));
        localStorage.removeItem("tn-materials-legend-anchor");
      }
    } catch {}

    try { setFloating(true); } catch {}
  }, [setFloating]);

  // Pointer-drag to float helper: attaches to non-floating container
  const pointerState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only primary
    if (!e.isPrimary || (e as any).button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
    pointerState.current = { startX: e.clientX, startY: e.clientY, moved: false };

    const onPointerMove = (ev: PointerEvent) => {
      const st = pointerState.current;
      if (!st) return;
      const dx = ev.clientX - st.startX;
      const dy = ev.clientY - st.startY;
      if (!st.moved && Math.hypot(dx, dy) > 6) {
        st.moved = true;
        try { localStorage.removeItem("tn-materials-legend-anchor"); } catch {}
        const px = Math.max(8, ev.clientX - 120);
        const py = Math.max(8, ev.clientY - 20);
        try { localStorage.setItem("tn-materials-legend-pos", JSON.stringify({ x: px, y: py })); } catch {}
        try { useUIStore.getState().setDockAssignment("materials-legend", null); } catch {}
        try { useUIStore.getState().setFloatingMaterialsLegend(true); } catch {}
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
      pointerState.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, []);

  // Prevent clicks from closing overlays when clicking legend items
  const stop = useCallback((e: React.SyntheticEvent) => { e.stopPropagation(); }, []);

  // Add native capture-phase listeners on the root to stop other handlers
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Only block click/mousedown from bubbling to global handlers.
    // Do NOT stop pointerdown or call stopImmediatePropagation — that prevents
    // drag/resize pointer handlers (registered elsewhere) from running.
    const stopNative = (ev: Event) => {
      try {
        ev.stopPropagation();
      } catch {}
    };

    el.addEventListener("mousedown", stopNative, { capture: true });
    el.addEventListener("click", stopNative, { capture: true });

    return () => {
      el.removeEventListener("mousedown", stopNative, { capture: true } as any);
      el.removeEventListener("click", stopNative, { capture: true } as any);
    };
  }, []);

  const content = (
    <div ref={rootRef} className="flex flex-col gap-1 px-2 py-1.5" onClick={stop} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-tn-text-muted font-medium">Materials</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-tn-text-muted">{materials.length}</span>
          <button
            title="Detach / Float legend"
            className="w-6 h-6 rounded bg-tn-panel-darker flex items-center justify-center text-xs"
            onClick={(e) => { e.stopPropagation(); detach((e.nativeEvent as MouseEvent) || undefined); }}
          >⇱</button>
        </div>
      </div>

      {materials.map((mat, i) => (
        <div
          key={i}
          className="flex items-center gap-2"
          draggable
          onDragStart={(e: React.DragEvent) => {
            const data = { name: mat.name, color: mat.color, roughness: mat.roughness, metalness: mat.metalness, emissive: mat.emissive };
            try {
              e.dataTransfer.setData("application/json", JSON.stringify(data));
              e.dataTransfer.setData("text/plain", JSON.stringify({ type: "material", name: mat.name }));
            } catch {}

            // Create a small drag image showing the swatch and name
            try {
              const canvas = document.createElement("canvas");
              canvas.width = 120;
              canvas.height = 28;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.fillStyle = mat.color || "#777";
                ctx.fillRect(4, 4, 20, 20);
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.font = "12px sans-serif";
                ctx.fillText(mat.name.slice(0, 24), 30, 18);
                e.dataTransfer.setDragImage(canvas, 40, 14);
              }
            } catch {}

            window.dispatchEvent(new CustomEvent("tn-material-dragstart", { detail: data }));
          }}
          onDragEnd={() => {
            window.dispatchEvent(new CustomEvent("tn-material-dragend"));
          }}
        >
          <div className="w-4 h-4 rounded-sm border border-white/10" style={{ background: mat.color, cursor: "grab" }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-tn-text font-medium truncate">{mat.name}</div>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[9px] text-tn-text-muted font-mono">R:{(mat.roughness ?? 0.8).toFixed(2)}</span>
              <span className="text-[9px] text-tn-text-muted font-mono">M:{(mat.metalness ?? 0.0).toFixed(2)}</span>
              {mat.emissive && <span className="text-[9px] text-amber-300 font-mono">⚡</span>}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-1 pt-1 border-t border-tn-border/40 text-[9px] text-tn-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-400 border border-white/10" />
          <div>Water / Fluid</div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-300 border border-white/10" />
          <div>Sand / Loose</div>
        </div>
      </div>
    </div>
  );

  // Floating mode: portal into FloatingBox (bottom-right default anchor)
  if (floating) {
    return (
      <FloatingBox id="materials-legend" defaultAnchor="bottom-right">
        <div onClick={stop} onPointerDown={stop}>
          {content}
        </div>
      </FloatingBox>
    );
  }

  // Non-floating: anchored bottom-right inside preview pane
  return (
    <div
      className="absolute bottom-2 right-2 z-10 flex flex-col gap-1 px-2 py-1.5 bg-tn-panel/90 border border-tn-border rounded"
      onContextMenu={(e) => { e.preventDefault(); detach(undefined); }}
      onPointerDown={onPointerDown}
      onClick={stop}
    >
      {content}
    </div>
  );
}
