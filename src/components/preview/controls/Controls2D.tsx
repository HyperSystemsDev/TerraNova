import { usePreviewStore } from "@/stores/previewStore";
import { SliderField } from "@/components/properties/SliderField";

export function Controls2D() {
  const resolution = usePreviewStore((s) => s.resolution);
  const setResolution = usePreviewStore((s) => s.setResolution);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);
  const setRange = usePreviewStore((s) => s.setRange);
  const yLevel = usePreviewStore((s) => s.yLevel);
  const setYLevel = usePreviewStore((s) => s.setYLevel);
  const showContours = usePreviewStore((s) => s.showContours);
  const setShowContours = usePreviewStore((s) => s.setShowContours);
  const contourInterval = usePreviewStore((s) => s.contourInterval);
  const setContourInterval = usePreviewStore((s) => s.setContourInterval);
  const resetCanvasTransform = usePreviewStore((s) => s.resetCanvasTransform);
  const showHillShade = usePreviewStore((s) => s.showHillShade);
  const setShowHillShade = usePreviewStore((s) => s.setShowHillShade);
  const showThresholdView = usePreviewStore((s) => s.showThresholdView);
  const setShowThresholdView = usePreviewStore((s) => s.setShowThresholdView);
  const showCrossSection = usePreviewStore((s) => s.showCrossSection);
  const setShowCrossSection = usePreviewStore((s) => s.setShowCrossSection);
  const showStatistics = usePreviewStore((s) => s.showStatistics);
  const setShowStatistics = usePreviewStore((s) => s.setShowStatistics);
  const statisticsLogScale = usePreviewStore((s) => s.statisticsLogScale);
  const setStatisticsLogScale = usePreviewStore((s) => s.setStatisticsLogScale);

  return (
    <>
      <SliderField label="Resolution" value={resolution} min={16} max={512} step={16} onChange={setResolution} />
      <SliderField label="Range Min" value={rangeMin} min={-256} max={0} step={1} onChange={(v) => setRange(v, rangeMax)} />
      <SliderField label="Range Max" value={rangeMax} min={0} max={256} step={1} onChange={(v) => setRange(rangeMin, v)} />
      <SliderField label="Y Level" value={yLevel} min={0} max={256} step={1} onChange={setYLevel} />

      <div className="flex flex-col gap-2 border-t border-tn-border pt-2">
        <span className="text-[10px] text-tn-text-muted font-medium">2D Options</span>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showHillShade} onChange={(e) => setShowHillShade(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Hill Shade
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showThresholdView} onChange={(e) => setShowThresholdView(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Terrain View
        </label>

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showContours} onChange={(e) => setShowContours(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Show Contours
        </label>

        {showContours && (
          <SliderField label="Contour Interval" value={contourInterval} min={0.05} max={2} step={0.05} onChange={setContourInterval} />
        )}

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showStatistics} onChange={(e) => setShowStatistics(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Statistics
        </label>

        {showStatistics && (
          <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer ml-4">
            <input type="checkbox" checked={statisticsLogScale} onChange={(e) => setStatisticsLogScale(e.target.checked)} className="accent-tn-accent w-3 h-3" />
            Log Scale
          </label>
        )}

        <label className="flex items-center gap-1.5 text-[11px] text-tn-text-muted cursor-pointer">
          <input type="checkbox" checked={showCrossSection} onChange={(e) => setShowCrossSection(e.target.checked)} className="accent-tn-accent w-3 h-3" />
          Cross-Section
        </label>

        <button
          onClick={resetCanvasTransform}
          className="px-2 py-0.5 text-[11px] rounded bg-tn-panel text-tn-text-muted hover:text-tn-text hover:bg-white/10 transition-colors border border-tn-border"
        >
          Reset View
        </button>
      </div>
    </>
  );
}
