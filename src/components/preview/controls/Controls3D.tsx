import { usePreviewStore } from "@/stores/previewStore";
import { SliderField } from "@/components/properties/SliderField";

export function Controls3D() {
  const resolution = usePreviewStore((s) => s.resolution);
  const setResolution = usePreviewStore((s) => s.setResolution);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const setRange = usePreviewStore((s) => s.setRange);
  const yLevel = usePreviewStore((s) => s.yLevel);
  const setYLevel = usePreviewStore((s) => s.setYLevel);
  const heightScale3D = usePreviewStore((s) => s.heightScale3D);
  const setHeightScale3D = usePreviewStore((s) => s.setHeightScale3D);
  const showWaterPlane = usePreviewStore((s) => s.showWaterPlane);
  const setShowWaterPlane = usePreviewStore((s) => s.setShowWaterPlane);
  const waterPlaneLevel = usePreviewStore((s) => s.waterPlaneLevel);
  const setWaterPlaneLevel = usePreviewStore((s) => s.setWaterPlaneLevel);
  const showFog3D = usePreviewStore((s) => s.showFog3D);
  const setShowFog3D = usePreviewStore((s) => s.setShowFog3D);
  const showSky3D = usePreviewStore((s) => s.showSky3D);
  const setShowSky3D = usePreviewStore((s) => s.setShowSky3D);
  const showSSAO = usePreviewStore((s) => s.showSSAO);
  const setShowSSAO = usePreviewStore((s) => s.setShowSSAO);
  const showEdgeOutline = usePreviewStore((s) => s.showEdgeOutline);
  const setShowEdgeOutline = usePreviewStore((s) => s.setShowEdgeOutline);

  return (
    <>
      <SliderField label="Resolution" value={resolution} min={16} max={512} step={16} onChange={setResolution} />
      <SliderField label="Range Min" value={rangeMin} min={-256} max={0} step={1} onChange={(v) => setRange(v, rangeMax)} />
      <SliderField label="Range Max" value={rangeMax} min={0} max={256} step={1} onChange={(v) => setRange(rangeMin, v)} />
      <SliderField label="Y Level" value={yLevel} min={0} max={256} step={1} onChange={setYLevel} />

      <div className="flex flex-col gap-2 border-t border-tn-border pt-2">
        <span className="text-[10px] text-tn-text-muted font-medium">3D Options</span>

        <SliderField label="Height Scale" value={heightScale3D} min={1} max={50} step={0.5} onChange={setHeightScale3D} />

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showWaterPlane} onChange={(e) => setShowWaterPlane(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Water Plane
        </label>

        {showWaterPlane && (
          <SliderField label="Water Level" value={waterPlaneLevel} min={0} max={1} step={0.01} onChange={setWaterPlaneLevel} />
        )}

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showFog3D} onChange={(e) => setShowFog3D(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Fog
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showSky3D} onChange={(e) => setShowSky3D(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Sky
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showSSAO} onChange={(e) => setShowSSAO(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          SSAO
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showEdgeOutline} onChange={(e) => setShowEdgeOutline(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Edge Outline
        </label>
      </div>
    </>
  );
}
