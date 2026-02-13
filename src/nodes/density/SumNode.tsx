import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityInput, densityOutput } from "@/nodes/shared/handles";

const SUM_HANDLES = [densityInput("InputA", "Input"), densityInput("InputB", "Input"), densityOutput()];

export const SumNode = memo(function SumNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={SUM_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">A + B</div>
    </BaseNode>
  );
});
