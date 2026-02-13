import { usePreviewStore } from "@/stores/previewStore";
import { useEditorStore } from "@/stores/editorStore";
import { SliderField } from "@/components/properties/SliderField";

export function PositionOverlayControls() {
  const showPositionOverlay = usePreviewStore((s) => s.showPositionOverlay);
  const setShowPositionOverlay = usePreviewStore((s) => s.setShowPositionOverlay);
  const positionOverlayNodeId = usePreviewStore((s) => s.positionOverlayNodeId);
  const setPositionOverlayNodeId = usePreviewStore((s) => s.setPositionOverlayNodeId);
  const positionOverlayPoints = usePreviewStore((s) => s.positionOverlayPoints);
  const positionOverlaySize = usePreviewStore((s) => s.positionOverlaySize);
  const setPositionOverlaySize = usePreviewStore((s) => s.setPositionOverlaySize);
  const positionOverlaySeed = usePreviewStore((s) => s.positionOverlaySeed);
  const setPositionOverlaySeed = usePreviewStore((s) => s.setPositionOverlaySeed);

  const nodes = useEditorStore((s) => s.nodes);
  const positionNodes = nodes.filter((n) => (n.type ?? "").startsWith("Position:"));

  return (
    <div className="flex flex-col gap-2 border-t border-tn-border pt-2">
      <span className="text-[10px] text-tn-text-muted font-medium">Position Overlay</span>

      <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showPositionOverlay}
          onChange={(e) => setShowPositionOverlay(e.target.checked)}
          className="accent-tn-accent w-3 h-3"
        />
        Show Positions
      </label>

      {showPositionOverlay && (
        <>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-tn-text-muted">Source</label>
            <select
              value={positionOverlayNodeId ?? "__auto__"}
              onChange={(e) => {
                const val = e.target.value;
                setPositionOverlayNodeId(val === "__auto__" ? null : val);
              }}
              className="bg-tn-panel border border-tn-border rounded px-2 py-1 text-[11px] text-tn-text"
            >
              <option value="__auto__">Auto-detect</option>
              {positionNodes.map((n) => {
                const data = n.data as Record<string, unknown>;
                const typeName = (data?.type as string) ?? n.type ?? "Node";
                return (
                  <option key={n.id} value={n.id}>
                    {typeName} ({n.id})
                  </option>
                );
              })}
            </select>
          </div>

          <SliderField label="Seed" value={positionOverlaySeed} min={0} max={999} step={1} onChange={setPositionOverlaySeed} />
          <SliderField label="Dot Size" value={positionOverlaySize} min={0.5} max={5} step={0.5} onChange={setPositionOverlaySize} />

          {positionOverlayPoints.length > 0 && (
            <div className="text-[10px] text-tn-text-muted font-mono">
              {positionOverlayPoints.length} positions
            </div>
          )}
        </>
      )}
    </div>
  );
}
