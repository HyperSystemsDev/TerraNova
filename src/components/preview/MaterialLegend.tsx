import type { VoxelMaterial } from "@/utils/voxelExtractor";

export function MaterialLegend({ materials }: { materials: VoxelMaterial[] }) {
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 px-2 py-1.5 bg-tn-panel/90 border border-tn-border rounded">
      <span className="text-[9px] text-tn-text-muted font-medium">Materials</span>
      {materials.map((mat, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border border-white/10"
            style={{ background: mat.color }}
          />
          <span className="text-[10px] text-tn-text font-mono">{mat.name}</span>
        </div>
      ))}
    </div>
  );
}
