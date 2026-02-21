import { useState } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { useProjectStore } from "@/stores/projectStore";
import { readAssetFile, writeAssetFile, writeTextFile } from "@/utils/ipc";
import { open as tauriOpen } from "@tauri-apps/plugin-dialog";
import { useToastStore } from "@/stores/toastStore";

export function SceneEnvironmentPanel() {
  const fogColor = usePreviewStore((s) => s.fogColor);
  const fogDensity = usePreviewStore((s) => s.fogDensity);
  const ambientSkyColor = usePreviewStore((s) => s.ambientSkyColor);
  const ambientGroundColor = usePreviewStore((s) => s.ambientGroundColor);
  const ambientIntensity = usePreviewStore((s) => s.ambientIntensity);
  const sunColor = usePreviewStore((s) => s.sunColor);
  const sunIntensity = usePreviewStore((s) => s.sunIntensity);
  const exposure = usePreviewStore((s) => s.exposure);

  const setFogParams = usePreviewStore((s) => s.setFogParams);
  const setAmbientParams = usePreviewStore((s) => s.setAmbientParams);
  const setSunParams = usePreviewStore((s) => s.setSunParams);
  const setExposure = usePreviewStore((s) => s.setExposure);

  const [localFogDensity, setLocalFogDensity] = useState<number>(fogDensity ?? 0.008);

  function applyFogColor(c: string) {
    setFogParams(c, localFogDensity);
  }

  function applyFogDensity(d: number) {
    setLocalFogDensity(d);
    setFogParams(fogColor ?? "#c0d8f0", d);
  }

  function resetDefaults() {
    setExposure(1.0);
    setFogParams("#c0d8f0", 0.008);
    setAmbientParams("#87CEEB", "#8B7355", 0.4);
    setSunParams("#fff5e0", 0.8);
  }

  return (
    <div className="p-3 border-t border-tn-border bg-tn-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-tn-text">Scene environment</div>
        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-0.5 bg-tn-panel-darker rounded" onClick={resetDefaults} aria-label="Reset environment">Reset</button>
          <button
            className="text-xs px-2 py-0.5 bg-tn-accent/10 border border-tn-border rounded"
            onClick={async () => {
              const projectPath = useProjectStore.getState().projectPath;
              if (!projectPath) {
                useToastStore.getState().addToast("No project open to save environment", "error");
                return;
              }

              const relPath = "HytaleGenerator/WorldStructures/MainWorld.json";
              try {
                const raw = await readAssetFile(relPath);
                if (!raw || typeof raw !== "object") {
                  useToastStore.getState().addToast("MainWorld.json not found or invalid", "error");
                  return;
                }

                const wrapper = { ...(raw as Record<string, unknown>) };
                // Build visuals wrapper from preview store
                const visuals: Record<string, unknown> = {};
                if (fogColor || localFogDensity) {
                  visuals.Fog = { Type: "Visual:Fog", Color: fogColor ?? "#c0d8f0", Density: Number(localFogDensity ?? 0.008) };
                }
                if (ambientSkyColor || ambientGroundColor) {
                  visuals.Ambient = { Type: "Visual:Ambient", SkyColor: ambientSkyColor ?? "#87CEEB", GroundColor: ambientGroundColor ?? "#8B7355", Intensity: Number(ambientIntensity ?? 0.4) };
                }
                visuals.TimeOfDay = { Type: "Visual:TimeOfDay", Time: Number(timeOfDay ?? 12), SunColor: sunColor ?? "#fff5e0", SunIntensity: Number(sunIntensity ?? 0.8) };

                wrapper.Visuals = visuals;
                await writeAssetFile(relPath, wrapper);
                useToastStore.getState().addToast("Scene environment saved to MainWorld.json", "success");
              } catch (err) {
                useToastStore.getState().addToast(`Failed to save environment: ${err}`, "error");
              }
            }}
            title="Save scene environment into project MainWorld.json"
          >
            Save to project
          </button>
          <button
            className="text-xs px-2 py-0.5 bg-tn-accent/10 border border-tn-border rounded"
            onClick={async () => {
              try {
                const folder = await tauriOpen({ directory: true });
                if (!folder || typeof folder !== "string") return;
                const baseName = prompt("Environment name", "MyEnvironment") || "MyEnvironment";
                const fileName = `Env_${baseName.replace(/[^a-zA-Z0-9-_]/g, "")}.json`;
                const fullPath = `${folder.replace(/\\\\/g, "/")}/${fileName}`;

                const visuals: Record<string, unknown> = {};
                if (fogColor || localFogDensity) {
                  visuals.Fog = { Type: "Visual:Fog", Color: fogColor ?? "#c0d8f0", Density: Number(localFogDensity ?? 0.008) };
                }
                if (ambientSkyColor || ambientGroundColor) {
                  visuals.Ambient = { Type: "Visual:Ambient", SkyColor: ambientSkyColor ?? "#87CEEB", GroundColor: ambientGroundColor ?? "#8B7355", Intensity: Number(ambientIntensity ?? 0.4) };
                }
                visuals.TimeOfDay = { Type: "Visual:TimeOfDay", Time: Number(timeOfDay ?? 12), SunColor: sunColor ?? "#fff5e0", SunIntensity: Number(sunIntensity ?? 0.8) };

                const out = { Type: "Environment", Visuals: visuals };
                await writeTextFile(fullPath, JSON.stringify(out, null, 2));
                useToastStore.getState().addToast(`Exported environment → ${fullPath}`, "success");
              } catch (err) {
                useToastStore.getState().addToast(`Export failed: ${err}`, "error");
              }
            }}
          >
            Export to folder
          </button>
        </div>
      </div>

      <div className="space-y-3 text-tn-text-muted text-xs">
        <div>
          <label className="flex items-center justify-between">
            <span>Exposure</span>
            <div className="flex items-center gap-2">
              <input className="w-40" type="range" min={0.1} max={4} step={0.01} value={String(exposure ?? 1)} onChange={(e) => setExposure(Number(e.target.value))} aria-label="Exposure" />
              <div className="w-12 text-right text-xs text-tn-text">{(exposure ?? 1).toFixed(2)}</div>
            </div>
          </label>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span>Fog</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: fogColor ?? "#c0d8f0", border: "1px solid rgba(0,0,0,0.12)" }} aria-hidden />
              <input title="Fog color" aria-label="Fog color" type="color" value={fogColor ?? "#c0d8f0"} onChange={(e) => applyFogColor(e.target.value)} />
              <input className="w-20 text-xs bg-transparent border border-tn-border rounded px-1" type="text" value={fogColor ?? "#c0d8f0"} onChange={(e) => applyFogColor(e.target.value)} />
            </div>
          </label>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-tn-text-muted">Density</span>
            <div className="flex items-center gap-2">
              <input className="w-40" type="range" min={0} max={0.05} step={0.001} value={String(localFogDensity)} onChange={(e) => applyFogDensity(Number(e.target.value))} aria-label="Fog density" />
              <div className="w-16 text-right text-xs text-tn-text">{Number(localFogDensity).toFixed(3)}</div>
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span>Ambient</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: ambientSkyColor ?? "#87CEEB", border: "1px solid rgba(0,0,0,0.12)" }} aria-hidden />
              <input title="Sky color" aria-label="Sky color" type="color" value={ambientSkyColor ?? "#87CEEB"} onChange={(e) => setAmbientParams(e.target.value, ambientGroundColor ?? "#8B7355", ambientIntensity ?? 0.4)} />
              <div className="w-5 h-5 rounded" style={{ backgroundColor: ambientGroundColor ?? "#8B7355", border: "1px solid rgba(0,0,0,0.12)" }} aria-hidden />
              <input title="Ground color" aria-label="Ground color" type="color" value={ambientGroundColor ?? "#8B7355"} onChange={(e) => setAmbientParams(ambientSkyColor ?? "#87CEEB", e.target.value, ambientIntensity ?? 0.4)} />
              <div className="ml-2 text-xs text-tn-text">Intensity</div>
              <input className="w-24" type="range" min={0} max={1} step={0.01} value={String(ambientIntensity ?? 0.4)} onChange={(e) => setAmbientParams(ambientSkyColor ?? "#87CEEB", ambientGroundColor ?? "#8B7355", Number(e.target.value))} aria-label="Ambient intensity" />
            </div>
          </label>
        </div>

        <div>
          <label className="flex items-center justify-between">
            <span>Sun</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: sunColor ?? "#fff5e0", border: "1px solid rgba(0,0,0,0.12)" }} aria-hidden />
              <input title="Sun color" aria-label="Sun color" type="color" value={sunColor ?? "#fff5e0"} onChange={(e) => setSunParams(e.target.value, sunIntensity ?? 0.8)} />
              <div className="ml-2 text-xs text-tn-text">Intensity</div>
              <input className="w-24" type="range" min={0} max={2} step={0.01} value={String(sunIntensity ?? 0.8)} onChange={(e) => setSunParams(sunColor ?? "#fff5e0", Number(e.target.value))} aria-label="Sun intensity" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default SceneEnvironmentPanel;
