import { usePreviewStore } from "@/stores/previewStore";
import { SliderField } from "@/components/properties/SliderField";

export function ControlsVoxel() {
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const setRange = usePreviewStore((s) => s.setRange);
  const voxelYMin = usePreviewStore((s) => s.voxelYMin);
  const setVoxelYMin = usePreviewStore((s) => s.setVoxelYMin);
  const voxelYMax = usePreviewStore((s) => s.voxelYMax);
  const setVoxelYMax = usePreviewStore((s) => s.setVoxelYMax);
  const voxelYSlices = usePreviewStore((s) => s.voxelYSlices);
  const setVoxelYSlices = usePreviewStore((s) => s.setVoxelYSlices);
  const voxelResolution = usePreviewStore((s) => s.voxelResolution);
  const setVoxelResolution = usePreviewStore((s) => s.setVoxelResolution);
  const showMaterialColors = usePreviewStore((s) => s.showMaterialColors);
  const setShowMaterialColors = usePreviewStore((s) => s.setShowMaterialColors);
  const showVoxelWireframe = usePreviewStore((s) => s.showVoxelWireframe);
  const setShowVoxelWireframe = usePreviewStore((s) => s.setShowVoxelWireframe);
  const showMaterialLegend = usePreviewStore((s) => s.showMaterialLegend);
  const setShowMaterialLegend = usePreviewStore((s) => s.setShowMaterialLegend);
  const showWaterPlane = usePreviewStore((s) => s.showWaterPlane);
  const setShowWaterPlane = usePreviewStore((s) => s.setShowWaterPlane);
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
      <SliderField label="Range Min" value={rangeMin} min={-256} max={0} step={1} onChange={(v) => setRange(v, rangeMax)} />
      <SliderField label="Range Max" value={rangeMax} min={0} max={256} step={1} onChange={(v) => setRange(rangeMin, v)} />

      <div className="flex flex-col gap-2 border-t border-tn-border pt-2">
        <span className="text-[10px] text-tn-text-muted font-medium">Voxel Options</span>

        <SliderField label="Resolution" value={voxelResolution} min={8} max={128} step={8} onChange={setVoxelResolution} />
        <SliderField label="Y Min" value={voxelYMin} min={0} max={255} step={1} onChange={setVoxelYMin} />
        <SliderField label="Y Max" value={voxelYMax} min={1} max={256} step={1} onChange={setVoxelYMax} />
        <SliderField label="Y Slices" value={voxelYSlices} min={8} max={128} step={4} onChange={setVoxelYSlices} />

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showMaterialColors} onChange={(e) => setShowMaterialColors(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Material Colors
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showVoxelWireframe} onChange={(e) => setShowVoxelWireframe(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Wireframe
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showMaterialLegend} onChange={(e) => setShowMaterialLegend(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Legend
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showWaterPlane} onChange={(e) => setShowWaterPlane(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Water Plane
        </label>

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
