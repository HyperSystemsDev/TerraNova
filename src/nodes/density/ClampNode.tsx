import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityInput, densityOutput } from "@/nodes/shared/handles";
import { safeDisplay } from "@/nodes/shared/displayUtils";

const CLAMP_HANDLES = [densityInput("Input", "Input"), densityOutput()];

export const ClampNode = memo(function ClampNode(props: TypedNodeProps) {
  const data = props.data;

  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={CLAMP_HANDLES}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Min</span>
          <span>{safeDisplay(data.fields.Min, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Max</span>
          <span>{safeDisplay(data.fields.Max, 1)}</span>
        </div>
      </div>
    </BaseNode>
  );
});
