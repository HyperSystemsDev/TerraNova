import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { useCompoundHandles } from "@/hooks/useCompoundHandles";

export const SumNode = memo(function SumNode(props: TypedNodeProps) {
  const handles = useCompoundHandles(props.id, "Sum");
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={handles}
    >
      <div className="text-tn-text-muted text-center py-1">A + B</div>
    </BaseNode>
  );
});
