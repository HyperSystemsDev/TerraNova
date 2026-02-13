import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityOutput } from "@/nodes/shared/handles";

const CONSTANT_HANDLES = [densityOutput()];

export const ConstantNode = memo(function ConstantNode(props: TypedNodeProps) {
  const data = props.data;

  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={CONSTANT_HANDLES}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Value</span>
        <span>{data.fields.Value ?? 0}</span>
      </div>
    </BaseNode>
  );
});
