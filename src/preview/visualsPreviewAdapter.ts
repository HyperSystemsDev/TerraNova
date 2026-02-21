import { usePreviewStore } from "@/stores/previewStore";

export type VisualFog = { color: string; density: number };
export type VisualAmbient = { skyColor: string; groundColor: string; intensity: number };
export type VisualTime = { time: number; sunColor?: string; sunIntensity?: number };

export type VisualsEvaluationResult = {
  fog?: VisualFog;
  ambient?: VisualAmbient;
  timeOfDay?: VisualTime;
  // Optional debug sources: node IDs that produced the resolved values
  fogSource?: string;
  ambientSkySource?: string;
  ambientGroundSource?: string;
  timeOfDaySource?: string;
};

/** Apply a shallow visual evaluation result into the preview store. */
export function applyVisualsToPreview(result: VisualsEvaluationResult) {
  const store = usePreviewStore.getState();
  if (result.fog) {
    store.setFogParams(result.fog.color, result.fog.density);
  }
  if (result.ambient) {
    store.setAmbientParams(result.ambient.skyColor, result.ambient.groundColor, result.ambient.intensity);
  }
  if (result.timeOfDay) {
    if (result.timeOfDay.sunColor || result.timeOfDay.sunIntensity) {
      store.setSunParams(result.timeOfDay.sunColor ?? store.sunColor, result.timeOfDay.sunIntensity ?? store.sunIntensity);
    }
    if (typeof result.timeOfDay.time === "number") store.setTimeOfDay(result.timeOfDay.time);
  }

  // Persist debug sources for overlay/tracing
  const debugSources: Record<string, string | undefined> = {};
  if (result.fogSource) debugSources.fog = result.fogSource;
  if (result.ambientSkySource) debugSources.ambientSky = result.ambientSkySource;
  if (result.ambientGroundSource) debugSources.ambientGround = result.ambientGroundSource;
  if (result.timeOfDaySource) debugSources.timeOfDay = result.timeOfDaySource;
  if (Object.keys(debugSources).length > 0) {
    store.setVisualDebugSources(debugSources);
  }
}
