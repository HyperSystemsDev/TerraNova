import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
// safeDisplay not needed here
import { tintOutput, tintInput, environmentOutput } from "@/nodes/shared/handles";
import { useEditorStore } from "@/stores/editorStore";

const HANDLES_FOG = [tintInput("Color", "Color"), tintOutput()];
const HANDLES_AMBIENT = [tintInput("SkyColor", "Sky Color"), tintInput("GroundColor", "Ground Color"), tintOutput()];
const HANDLES_TIME = [environmentOutput()];

export const FogVisualNode = memo(function FogVisualNode(props: TypedNodeProps) {
  const data = props.data as any;
  const update = useEditorStore((s) => s.updateNodeField);
  return (
    <BaseNode {...props} category={AssetCategory.TintProvider} handles={HANDLES_FOG}>
      <div className="flex justify-between items-center">
        <span className="text-tn-text-muted">Color</span>
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={String(data.fields.Color ?? "#c0d8f0")}
            onChange={(e) => update(props.id, "Color", e.target.value)}
            className="w-6 h-6 p-0 border-none"
            aria-label="Fog color"
          />
          <input
            type="text"
            value={String(data.fields.Color ?? "#c0d8f0")}
            onChange={(e) => update(props.id, "Color", e.target.value)}
            className="w-20 text-xs bg-transparent border border-tn-border rounded px-1"
          />
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-tn-text-muted">Density</span>
        <input
          type="number"
          step="0.001"
          value={String(data.fields.Density ?? 0.008)}
          onChange={(e) => update(props.id, "Density", Number(e.target.value))}
          className="w-20 text-xs bg-transparent border border-tn-border rounded px-1"
        />
      </div>
    </BaseNode>
  );
});

export const AmbientVisualNode = memo(function AmbientVisualNode(props: TypedNodeProps) {
  const data = props.data as any;
  const update = useEditorStore((s) => s.updateNodeField);
  function applyPreset(name: string) {
    if (name === "Clear") {
      update(props.id, "SkyColor", "#87CEEB");
      update(props.id, "GroundColor", "#8B7355");
      update(props.id, "Intensity", 0.45);
    } else if (name === "Overcast") {
      update(props.id, "SkyColor", "#9fb7c7");
      update(props.id, "GroundColor", "#6f6b5e");
      update(props.id, "Intensity", 0.25);
    } else if (name === "Sunset") {
      update(props.id, "SkyColor", "#ffb07c");
      update(props.id, "GroundColor", "#6b3f2b");
      update(props.id, "Intensity", 0.6);
    }
  }
  return (
    <BaseNode {...props} category={AssetCategory.TintProvider} handles={HANDLES_AMBIENT}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-tn-text-muted text-xs">Sky Color</span>
            <span className="text-tn-text-muted text-2xs">ambient sky tint</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(data.fields.SkyColor ?? "#87CEEB")}
              onChange={(e) => update(props.id, "SkyColor", e.target.value)}
              className="w-7 h-7 p-0 border-none rounded"
              aria-label="Sky color"
            />
            <input
              type="text"
              value={String(data.fields.SkyColor ?? "#87CEEB")}
              onChange={(e) => update(props.id, "SkyColor", e.target.value)}
              className="w-28 text-xs bg-transparent border border-tn-border rounded px-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-tn-text-muted text-xs">Ground Color</span>
            <span className="text-tn-text-muted text-2xs">ambient ground tint</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(data.fields.GroundColor ?? "#8B7355")}
              onChange={(e) => update(props.id, "GroundColor", e.target.value)}
              className="w-7 h-7 p-0 border-none rounded"
              aria-label="Ground color"
            />
            <input
              type="text"
              value={String(data.fields.GroundColor ?? "#8B7355")}
              onChange={(e) => update(props.id, "GroundColor", e.target.value)}
              className="w-28 text-xs bg-transparent border border-tn-border rounded px-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-tn-text-muted">Intensity</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={String(data.fields.Intensity ?? 0.4)}
              onChange={(e) => update(props.id, "Intensity", Number(e.target.value))}
              className="w-36"
            />
            <input
              type="number"
              step="0.01"
              value={String(data.fields.Intensity ?? 0.4)}
              onChange={(e) => update(props.id, "Intensity", Number(e.target.value))}
              className="w-16 text-xs bg-transparent border border-tn-border rounded px-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button className="px-2 py-1 text-[11px] bg-tn-panel-darker rounded" onClick={() => applyPreset("Clear")}>Clear</button>
          <button className="px-2 py-1 text-[11px] bg-tn-panel-darker rounded" onClick={() => applyPreset("Overcast")}>Overcast</button>
          <button className="px-2 py-1 text-[11px] bg-tn-panel-darker rounded" onClick={() => applyPreset("Sunset")}>Sunset</button>
        </div>
      </div>
    </BaseNode>
  );
});

export const TimeOfDayVisualNode = memo(function TimeOfDayVisualNode(props: TypedNodeProps) {
  const data = props.data as any;
  const update = useEditorStore((s) => s.updateNodeField);
  return (
    <BaseNode {...props} category={AssetCategory.EnvironmentProvider} handles={HANDLES_TIME}>
      <div className="flex justify-between items-center">
        <span className="text-tn-text-muted">Time</span>
        <input type="number" step="0.1" value={String(data.fields.Time ?? 12)} onChange={(e) => update(props.id, "Time", Number(e.target.value))} className="w-20 text-xs bg-transparent border border-tn-border rounded px-1" />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-tn-text-muted">Sun</span>
        <div className="flex items-center gap-1">
          <input type="color" value={String(data.fields.SunColor ?? "#fff5e0")} onChange={(e) => update(props.id, "SunColor", e.target.value)} className="w-6 h-6 p-0 border-none" aria-label="Sun color" />
          <input type="text" value={String(data.fields.SunColor ?? "#fff5e0")} onChange={(e) => update(props.id, "SunColor", e.target.value)} className="w-20 text-xs bg-transparent border border-tn-border rounded px-1" />
        </div>
      </div>
    </BaseNode>
  );
});

export default {};
