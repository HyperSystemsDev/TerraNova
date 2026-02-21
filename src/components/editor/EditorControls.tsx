import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-tn-border rounded bg-tn-surface/80 p-2">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen((s) => !s)}>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-tn-text-muted">{open ? "-" : "+"}</div>
      </div>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

export function EditorControls() {
  const showGrid = useUIStore((s) => s.showGrid);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const snapToGrid = useUIStore((s) => s.snapToGrid);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const gridSize = useUIStore((s) => s.gridSize);
  const setGridSize = useUIStore((s) => s.setGridSize);
  const showMinimap = useUIStore((s) => s.showMinimap);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);
  const previewHudVisible = useUIStore((s) => s.previewHudVisible);
  const setPreviewHudVisible = useUIStore((s) => s.setPreviewHudVisible);
  const setFloatingEditorControls = useUIStore((s) => s.setFloatingEditorControls);
  const floating = useUIStore((s) => s.floatingEditorControls);

  // Tool-specific local settings (persisted locally)
  const [brushSize, setBrushSize] = useState(() => {
    try { return Number(localStorage.getItem("tn-tool-brush-size") ?? 24); } catch { return 24; }
  });

  const updateBrush = (v: number) => {
    setBrushSize(v);
    try { localStorage.setItem("tn-tool-brush-size", String(v)); } catch {}
    window.dispatchEvent(new CustomEvent("tn-tool-change", { detail: { tool: "brush", size: v } }));
  };

  return (
    <div className="flex flex-col gap-2 p-2 w-64">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Editor Controls</div>
        <button
          title={floating ? "Reattach" : "Float"}
          aria-label={floating ? "Reattach editor controls" : "Float editor controls"}
          className="text-xs px-2 py-0.5 rounded bg-tn-panel-darker flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setFloatingEditorControls(!floating); }}
        >
          {floating ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M16 8l-8 8" />
              <path d="M8 8h8v8" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M8 16l8-8" />
              <path d="M16 16V8H8" />
            </svg>
          )}
        </button>
      </div>

      <Section title="Canvas">
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between text-sm">
            <span>Show grid</span>
            <input type="checkbox" checked={showGrid} onChange={() => toggleGrid()} />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Snap to grid</span>
            <input type="checkbox" checked={snapToGrid} onChange={() => toggleSnap()} />
          </label>

          <div className="text-xs text-tn-text-muted">Grid size: {gridSize}px</div>
          <input
            className="w-full"
            type="range"
            min={4}
            max={128}
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
          />
        </div>
      </Section>

      <Section title="View">
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between text-sm">
            <span>Preview HUD</span>
            <input type="checkbox" checked={previewHudVisible} onChange={() => setPreviewHudVisible(!previewHudVisible)} />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Minimap</span>
            <input type="checkbox" checked={showMinimap} onChange={() => toggleMinimap()} />
          </label>
        </div>
      </Section>

      <Section title="Tools">
        <div className="flex flex-col gap-2">
          <div className="text-sm">Brush</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={128}
              value={brushSize}
              onChange={(e) => updateBrush(Number(e.target.value))}
              className="flex-1"
            />
            <div className="w-10 text-right text-sm">{brushSize}px</div>
          </div>
          <div className="text-xs text-tn-text-muted">Tool groups expose per-tool settings — drag to move or attach this panel.</div>
        </div>
      </Section>
    </div>
  );
}

export default EditorControls;
