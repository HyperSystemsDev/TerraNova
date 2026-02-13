import { describe, it, expect } from "vitest";
import type { SettingsConfig } from "@/stores/editorStore";

/**
 * Mirrors the isSettingsFile() detection logic from useTauriIO.ts.
 */
function isSettingsFile(content: Record<string, unknown>, filePath: string): boolean {
  if ("Type" in content) return false;
  const pathLower = filePath.toLowerCase();
  return (pathLower.endsWith("settings.json") && pathLower.includes("settings/")) &&
    ("CustomConcurrency" in content || "BufferCapacityFactor" in content ||
     "TargetViewDistance" in content);
}

/**
 * Mirrors the Settings load logic from useTauriIO.ts.
 */
function loadSettingsConfig(raw: Record<string, unknown>): SettingsConfig {
  return {
    CustomConcurrency: (raw.CustomConcurrency as number) ?? -1,
    BufferCapacityFactor: (raw.BufferCapacityFactor as number) ?? 0.4,
    TargetViewDistance: (raw.TargetViewDistance as number) ?? 1024,
    TargetPlayerCount: (raw.TargetPlayerCount as number) ?? 8,
    StatsCheckpoints: Array.isArray(raw.StatsCheckpoints) ? raw.StatsCheckpoints as number[] : [],
  };
}

/**
 * Mirrors the Settings save logic from useTauriIO.ts.
 */
function saveSettingsConfig(
  settingsConfig: SettingsConfig,
  originalWrapper: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...originalWrapper };
  output.CustomConcurrency = settingsConfig.CustomConcurrency;
  output.BufferCapacityFactor = settingsConfig.BufferCapacityFactor;
  output.TargetViewDistance = settingsConfig.TargetViewDistance;
  output.TargetPlayerCount = settingsConfig.TargetPlayerCount;
  output.StatsCheckpoints = settingsConfig.StatsCheckpoints;
  return output;
}

const SAMPLE_SETTINGS = {
  CustomConcurrency: -1,
  BufferCapacityFactor: 0.4,
  TargetViewDistance: 1024.0,
  TargetPlayerCount: 8.0,
  StatsCheckpoints: [],
};

describe("Settings detection", () => {
  it("identifies a Settings.json file correctly", () => {
    expect(isSettingsFile(SAMPLE_SETTINGS, "/pack/Settings/Settings.json")).toBe(true);
  });

  it("rejects a typed asset file", () => {
    const typed = { Type: "NoiseRange", CustomConcurrency: -1 };
    expect(isSettingsFile(typed, "/pack/Settings/Settings.json")).toBe(false);
  });

  it("rejects a biome file", () => {
    const biome = { Terrain: {}, Props: [], Name: "forest" };
    expect(isSettingsFile(biome, "/pack/Biomes/forest.json")).toBe(false);
  });

  it("rejects a file not in Settings/ directory", () => {
    expect(isSettingsFile(SAMPLE_SETTINGS, "/pack/Other/Settings.json")).toBe(false);
  });

  it("rejects a file not named Settings.json", () => {
    expect(isSettingsFile(SAMPLE_SETTINGS, "/pack/Settings/config.json")).toBe(false);
  });
});

describe("Settings load", () => {
  it("loads all fields from raw JSON", () => {
    const config = loadSettingsConfig(SAMPLE_SETTINGS);
    expect(config.CustomConcurrency).toBe(-1);
    expect(config.BufferCapacityFactor).toBe(0.4);
    expect(config.TargetViewDistance).toBe(1024.0);
    expect(config.TargetPlayerCount).toBe(8.0);
    expect(config.StatsCheckpoints).toEqual([]);
  });

  it("provides defaults for missing fields", () => {
    const config = loadSettingsConfig({});
    expect(config.CustomConcurrency).toBe(-1);
    expect(config.BufferCapacityFactor).toBe(0.4);
    expect(config.TargetViewDistance).toBe(1024);
    expect(config.TargetPlayerCount).toBe(8);
    expect(config.StatsCheckpoints).toEqual([]);
  });

  it("handles StatsCheckpoints with values", () => {
    const raw = { ...SAMPLE_SETTINGS, StatsCheckpoints: [64, 128, 256] };
    const config = loadSettingsConfig(raw);
    expect(config.StatsCheckpoints).toEqual([64, 128, 256]);
  });

  it("handles non-array StatsCheckpoints gracefully", () => {
    const raw = { ...SAMPLE_SETTINGS, StatsCheckpoints: "invalid" };
    const config = loadSettingsConfig(raw as Record<string, unknown>);
    expect(config.StatsCheckpoints).toEqual([]);
  });
});

describe("Settings save", () => {
  it("produces flat JSON output", () => {
    const config = loadSettingsConfig(SAMPLE_SETTINGS);
    const output = saveSettingsConfig(config, SAMPLE_SETTINGS);
    expect(output).toEqual(SAMPLE_SETTINGS);
  });

  it("preserves extra fields from originalWrapper", () => {
    const wrapper = { ...SAMPLE_SETTINGS, UnknownField: "preserved" };
    const config = loadSettingsConfig(wrapper);
    const output = saveSettingsConfig(config, wrapper);
    expect(output.UnknownField).toBe("preserved");
  });

  it("overwrites config values in output", () => {
    const config = loadSettingsConfig(SAMPLE_SETTINGS);
    config.CustomConcurrency = 4;
    config.TargetViewDistance = 512;
    const output = saveSettingsConfig(config, SAMPLE_SETTINGS);
    expect(output.CustomConcurrency).toBe(4);
    expect(output.TargetViewDistance).toBe(512);
  });
});

describe("Settings config change", () => {
  it("updates a single field correctly", () => {
    const config = loadSettingsConfig(SAMPLE_SETTINGS);
    const updated = { ...config, CustomConcurrency: 8 };
    expect(updated.CustomConcurrency).toBe(8);
    expect(updated.BufferCapacityFactor).toBe(0.4);
  });

  it("updates StatsCheckpoints array", () => {
    const config = loadSettingsConfig(SAMPLE_SETTINGS);
    const updated = { ...config, StatsCheckpoints: [64, 128] };
    expect(updated.StatsCheckpoints).toEqual([64, 128]);
  });
});

describe("Settings round-trip", () => {
  it("load -> modify -> save -> reload preserves values", () => {
    const original = { ...SAMPLE_SETTINGS, ExtraField: true };

    // Load
    const config = loadSettingsConfig(original);

    // Modify
    config.CustomConcurrency = 4;
    config.TargetViewDistance = 512;
    config.StatsCheckpoints = [100, 200];

    // Save
    const saved = saveSettingsConfig(config, original);

    // Reload
    const reloaded = loadSettingsConfig(saved as Record<string, unknown>);
    expect(reloaded.CustomConcurrency).toBe(4);
    expect(reloaded.TargetViewDistance).toBe(512);
    expect(reloaded.StatsCheckpoints).toEqual([100, 200]);
    expect(reloaded.BufferCapacityFactor).toBe(0.4);
    expect(reloaded.TargetPlayerCount).toBe(8.0);

    // Extra fields preserved
    expect(saved.ExtraField).toBe(true);
  });
});
