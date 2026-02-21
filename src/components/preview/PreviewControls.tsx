import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useUIStore } from "@/stores/uiStore";
import { SharedControls } from "./controls/SharedControls";
import { Controls2D } from "./controls/Controls2D";
import { Controls3D } from "./controls/Controls3D";
import { ControlsVoxel } from "./controls/ControlsVoxel";
import { ControlsWorld } from "./controls/ControlsWorld";
import { PositionOverlayControls } from "./controls/PositionOverlayControls";


export function PreviewHUD() {
  const hudVisible = useUIStore((s) => s.previewHudVisible);
  const time = usePreviewStore((s) => s.timeOfDay);
  const setTime = usePreviewStore((s) => s.setTimeOfDay);
  const setSun = usePreviewStore((s) => s.setSunParams);
  const sunColor = usePreviewStore((s) => s.sunColor);
  const sunIntensity = usePreviewStore((s) => s.sunIntensity);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const [anchor, setAnchor] = useState<any>(() => {
    try { return (localStorage.getItem("tn-preview-hud-anchor") as any) || null; } catch { return null; }
  });
  const startRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const [minimized, setMinimized] = useState<boolean>(() => {
    try { return localStorage.getItem("tn-preview-hud-minimized") === "true"; } catch { return false; }
  });
  const [showColors, setShowColors] = useState(false);
  useEffect(() => { try { localStorage.setItem("tn-preview-hud-minimized", minimized ? "true" : "false"); } catch {} }, [minimized]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tn-preview-hud-pos");
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        // clamp to viewport so HUD isn't lost off-screen
        const w = window.innerWidth || 1024;
        const h = window.innerHeight || 768;
        const clamped = {
          x: Math.max(8, Math.min(p.x, Math.max(8, w - 160))),
          y: Math.max(8, Math.min(p.y, Math.max(8, h - 80))),
        };
        setPos(clamped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { if (anchor) localStorage.setItem("tn-preview-hud-anchor", anchor); } catch {}
  }, [anchor]);

  useEffect(() => {
    try {
      if (pos) localStorage.setItem("tn-preview-hud-pos", JSON.stringify(pos));
    } catch {}
  }, [pos]);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    let last = performance.now();
    let current = usePreviewStore.getState().timeOfDay ?? 12;
    function step(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      current = (current + dt * 0.5) % 24;
      setTime(current);
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, setTime]);

  // Drag handlers
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.mouseX;
      const dy = e.clientY - startRef.current.mouseY;
      const next = { x: startRef.current.startX + dx, y: startRef.current.startY + dy };
      posRef.current = next;
      setPos(next);
    }
    function onUp() {
      setDragging(false);
      startRef.current = null;
      // when user explicitly drags, clear anchor so custom position is respected
      setAnchor(null);
      try { document.body.style.userSelect = ""; } catch {}

      // Try HUD snap-back using UI settings
      try {
        const uiState = useUIStore.getState ? useUIStore.getState() : (null as any);
        const snapEnabled = uiState?.snapBackEnabled ?? true;
        const edgeThreshold = Number(uiState?.snapEdgeThreshold ?? 80);
        if (!snapEnabled) return;
        const p = posRef.current;
        if (!p) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const leftEdge = p.x < edgeThreshold;
        const rightEdge = p.x > w - edgeThreshold;
        const topEdge = p.y < edgeThreshold;
        const bottomEdge = p.y > h - edgeThreshold;
        if (leftEdge || rightEdge || topEdge || bottomEdge) {
          // snap to nearest corner/edge with safe clamping
          const margin = 12;
          let nx = p.x;
          let ny = p.y;
          if (topEdge) ny = margin;
          if (bottomEdge) ny = Math.max(margin, h - 160 - margin);
          if (leftEdge) nx = margin;
          if (rightEdge) nx = Math.max(margin, w - 320 - margin);
          setPos({ x: Math.max(8, Math.min(nx, Math.max(8, w - 160))), y: Math.max(8, Math.min(ny, Math.max(8, h - 80))) });
          const anchorKey = topEdge ? (leftEdge ? "top-left" : "top-right") : (bottomEdge ? (leftEdge ? "bottom-left" : "bottom-right") : null);
          if (anchorKey) {
            setAnchor(anchorKey);
            try { localStorage.setItem("tn-preview-hud-anchor", anchorKey); } catch {}
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (dragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // (Import/export utilities removed to avoid unused declarations in production build.)

  const style: CSSProperties = pos ? { left: pos.x, top: pos.y } : { pointerEvents: "auto" };
  const [presetList, setPresetList] = useState<string[]>(() => usePreviewStore.getState().listVisualPresets());
  const [presetSelected, setPresetSelected] = useState<string | null>(null);
  // Subscribed preview values for reactive updates
  const exposure = usePreviewStore((s) => s.exposure);
  const setExposure = usePreviewStore((s) => s.setExposure);
  const showFog3D = usePreviewStore((s) => s.showFog3D);
  const setShowFog3D = usePreviewStore((s) => s.setShowFog3D);
  const showSky3D = usePreviewStore((s) => s.showSky3D);
  const setShowSky3D = usePreviewStore((s) => s.setShowSky3D);
  const fogColor = usePreviewStore((s) => s.fogColor);
  const setFogParams = usePreviewStore((s) => s.setFogParams);
  const ambientSkyColor = usePreviewStore((s) => s.ambientSkyColor);
  const ambientGroundColor = usePreviewStore((s) => s.ambientGroundColor);
  const ambientIntensity = usePreviewStore((s) => s.ambientIntensity);
  const setAmbientParams = usePreviewStore((s) => s.setAmbientParams);

  // Ensure hooks above are always called in the same order — if HUD is hidden, still return null
  if (!hudVisible) return null;

  return (
    <div
      className={`absolute z-20 rounded-lg p-2 text-sm text-tn-text max-w-[560px]`}
      style={{ ...style, cursor: dragging ? "grabbing" : "grab", userSelect: dragging ? "none" : undefined, background: "rgba(20,20,20,0.6)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}
      onMouseDown={(e) => {
        if (e.button !== 0) return; // only primary button
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "BUTTON" || tag === "SELECT") return;
        const currentPos = posRef.current;
        setDragging(true);
        startRef.current = { mouseX: e.clientX, mouseY: e.clientY, startX: currentPos?.x ?? 100, startY: currentPos?.y ?? 80 };
        try { document.body.style.userSelect = "none"; } catch {}
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        const currentPos = posRef.current;
        setDragging(true);
        startRef.current = { mouseX: t.clientX, mouseY: t.clientY, startX: currentPos?.x ?? 100, startY: currentPos?.y ?? 80 };
        try { document.body.style.userSelect = "none"; } catch {}
      }}
      onTouchMove={(e) => {
        if (!startRef.current) return;
        const t = e.touches[0];
        const dx = t.clientX - startRef.current.mouseX;
        const dy = t.clientY - startRef.current.mouseY;
        const next = { x: startRef.current.startX + dx, y: startRef.current.startY + dy };
        posRef.current = next;
        setPos(next);
      }}
      onTouchEnd={() => {
        setDragging(false);
        startRef.current = null;
        try { document.body.style.userSelect = ""; } catch {}
      }}
    >
      <div className="flex items-center gap-3">
        <button className="px-2 py-1 rounded bg-tn-panel-darker text-xs" title="Minimize" onClick={() => setMinimized((m) => !m)}>{minimized ? "▢" : "—"}</button>
        <button className="px-3 py-1 rounded bg-tn-accent text-white" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>

        <div className="flex items-center gap-2 flex-1">
          <input className="flex-1" type="range" min={0} max={24} step={0.1} value={String(time ?? 12)} onChange={(e) => setTime(Number(e.target.value))} />
          <div className="w-12 text-xs text-right">{(time ?? 12).toFixed(1)}h</div>
        </div>

        <div className="flex items-center gap-2">
          <input type="color" value={sunColor ?? "#fff5e0"} onChange={(e) => setSun(e.target.value, sunIntensity)} title="Sun color" />
        </div>
        <button className="px-2 py-1 ml-1 rounded bg-tn-panel-darker text-xs" onClick={() => setShowColors((s) => !s)}>{showColors ? "Colors ▴" : "Colors ▾"}</button>
      </div>

      {showColors && (
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-2">
            <label className="text-xs">Fog</label>
            <input type="color" value={fogColor} onChange={(e) => setFogParams(e.target.value, usePreviewStore.getState().fogDensity)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs">Sky</label>
            <input type="color" value={ambientSkyColor} onChange={(e) => setAmbientParams(e.target.value, ambientGroundColor, ambientIntensity)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs">Ground</label>
            <input type="color" value={ambientGroundColor} onChange={(e) => setAmbientParams(ambientSkyColor, e.target.value, ambientIntensity)} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-2">
          <label className="text-xs">Exposure</label>
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.05}
            value={String(exposure ?? 1)}
            onChange={(e) => setExposure(Number(e.target.value))}
            className="w-40"
          />
          <div className="text-xs w-10 text-right">{(exposure ?? 1).toFixed(2)}</div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs">Fog</label>
          <input type="checkbox" checked={showFog3D} onChange={(e) => setShowFog3D(e.target.checked)} />
          <label className="text-xs">Sky</label>
          <input type="checkbox" checked={showSky3D} onChange={(e) => setShowSky3D(e.target.checked)} />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            className="px-2 py-1 bg-tn-panel-darker rounded text-xs"
            onClick={() => {
              const name = window.prompt("Preset name to save:");
              if (name) {
                usePreviewStore.getState().saveVisualPreset(name);
                setPresetList(usePreviewStore.getState().listVisualPresets());
              }
            }}
          >
            Save
          </button>
          <select
            className="text-xs bg-tn-panel-darker rounded p-1"
            value={presetSelected ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setPresetSelected(v || null);
              if (v) usePreviewStore.getState().loadVisualPreset(v);
            }}
          >
            <option value="">Presets</option>
            {presetList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            className="px-2 py-1 bg-tn-panel-darker rounded text-xs"
            onClick={() => {
              const s = usePreviewStore.getState();
              s.setExposure(1.0);
              s.setFogParams("#c0d8f0", 0.008);
              s.setAmbientParams("#87CEEB", "#8B7355", 0.4);
              s.setSunParams("#fff5e0", 0.8);
              s.setTimeOfDay(12);
              s.setShowFog3D(true);
              s.setShowSky3D(true);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
export default PreviewHUD;

export function PreviewControls({ canvasRef, hideSharedControls }: { canvasRef?: React.RefObject<HTMLCanvasElement | null>; hideSharedControls?: boolean }) {
  const mode = usePreviewStore((s) => s.mode);

  return (
    <div className="flex flex-col gap-3 p-3">
      {!hideSharedControls && <SharedControls canvasRef={canvasRef} />}
      {mode === "2d" && <Controls2D />}
      {mode === "3d" && <Controls3D />}
      {mode === "voxel" && <ControlsVoxel />}
      {mode === "world" && <ControlsWorld />}
      {(mode === "2d" || mode === "3d") && <PositionOverlayControls />}
    </div>
  );
}
