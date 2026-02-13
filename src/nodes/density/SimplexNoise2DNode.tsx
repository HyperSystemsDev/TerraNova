import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityOutput } from "@/nodes/shared/handles";
import { safeDisplay } from "@/nodes/shared/displayUtils";

const SIMPLEX_NOISE_2D_HANDLES = [densityOutput()];

export const SimplexNoise2DNode = memo(function SimplexNoise2DNode(props: TypedNodeProps) {
  const data = props.data;

  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={SIMPLEX_NOISE_2D_HANDLES}>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Freq</span>
          <span>{safeDisplay(data.fields.Frequency, 0.01)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Amp</span>
          <span>{safeDisplay(data.fields.Amplitude, 1.0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Seed</span>
          <span>{safeDisplay(data.fields.Seed, 0)}</span>
        </div>
      </div>
    </BaseNode>
  );
});
