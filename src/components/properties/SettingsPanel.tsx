import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { SliderField } from "./SliderField";
import { FieldTooltip } from "./FieldTooltip";
import { FIELD_DESCRIPTIONS, getShortDescription } from "@/schema/fieldDescriptions";

interface SettingsPanelProps {
  onSettingsConfigChange: (field: string, value: unknown) => void;
  onBlur: () => void;
}

export function SettingsPanel({ onSettingsConfigChange, onBlur }: SettingsPanelProps) {
  const settingsConfig = useEditorStore((s) => s.settingsConfig);
  const [newCheckpoint, setNewCheckpoint] = useState("");

  if (!settingsConfig) return null;

  const descriptions = FIELD_DESCRIPTIONS["Settings"] ?? {};
  const desc = (key: string): string | undefined => {
    const d = descriptions[key];
    return d != null ? getShortDescription(d) : undefined;
  };

  const handleAddCheckpoint = () => {
    const val = parseFloat(newCheckpoint);
    if (isNaN(val)) return;
    onSettingsConfigChange("StatsCheckpoints", [...settingsConfig.StatsCheckpoints, val]);
    setNewCheckpoint("");
  };

  const handleRemoveCheckpoint = (index: number) => {
    const next = settingsConfig.StatsCheckpoints.filter((_, i) => i !== index);
    onSettingsConfigChange("StatsCheckpoints", next);
  };

  return (
    <div className="flex flex-col p-3 gap-3">
      {/* Header */}
      <div className="border-b border-tn-border pb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-tn-text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold">Worldgen Settings</h3>
          <p className="text-xs text-tn-text-muted">Server configuration for world generation</p>
        </div>
      </div>

      {/* CustomConcurrency */}
      <div>
        <SliderField
          label="CustomConcurrency"
          value={settingsConfig.CustomConcurrency}
          min={-1}
          max={32}
          step={1}
          description={desc("CustomConcurrency")}
          onChange={(v) => onSettingsConfigChange("CustomConcurrency", v)}
          onBlur={onBlur}
        />
        {settingsConfig.CustomConcurrency === -1 && (
          <p className="text-[10px] text-sky-400 mt-0.5 ml-0.5">Auto (uses all available cores)</p>
        )}
      </div>

      {/* BufferCapacityFactor */}
      <SliderField
        label="BufferCapacityFactor"
        value={settingsConfig.BufferCapacityFactor}
        min={0.1}
        max={2.0}
        step={0.1}
        description={desc("BufferCapacityFactor")}
        onChange={(v) => onSettingsConfigChange("BufferCapacityFactor", Math.round(v * 10) / 10)}
        onBlur={onBlur}
      />

      {/* TargetViewDistance */}
      <SliderField
        label="TargetViewDistance"
        value={settingsConfig.TargetViewDistance}
        min={64}
        max={2048}
        step={64}
        description={desc("TargetViewDistance")}
        onChange={(v) => onSettingsConfigChange("TargetViewDistance", v)}
        onBlur={onBlur}
      />

      {/* TargetPlayerCount */}
      <SliderField
        label="TargetPlayerCount"
        value={settingsConfig.TargetPlayerCount}
        min={1}
        max={64}
        step={1}
        description={desc("TargetPlayerCount")}
        onChange={(v) => onSettingsConfigChange("TargetPlayerCount", v)}
        onBlur={onBlur}
      />

      {/* StatsCheckpoints */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-tn-text-muted flex items-center">
            StatsCheckpoints ({settingsConfig.StatsCheckpoints.length})
            {desc("StatsCheckpoints") && (
              <FieldTooltip description={desc("StatsCheckpoints")!} />
            )}
          </span>
        </div>
        {settingsConfig.StatsCheckpoints.length > 0 && (
          <div className="flex flex-col gap-1 pl-3 border-l border-tn-border">
            {settingsConfig.StatsCheckpoints.map((val, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs text-tn-text flex-1">{val}</span>
                <button
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => handleRemoveCheckpoint(i)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <input
            type="number"
            value={newCheckpoint}
            onChange={(e) => setNewCheckpoint(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCheckpoint(); }}
            placeholder="Y value"
            className="flex-1 px-1.5 py-0.5 text-xs bg-tn-bg border border-tn-border rounded"
          />
          <button
            className="text-xs text-tn-accent hover:text-tn-accent/80 px-1.5 py-0.5"
            onClick={handleAddCheckpoint}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
