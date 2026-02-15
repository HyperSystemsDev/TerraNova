import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { assignmentInput, assignmentOutput, densityInput, propInput } from "@/nodes/shared/handles";
import { safeDisplay } from "@/nodes/shared/displayUtils";
import { useCompoundHandles } from "@/hooks/useCompoundHandles";

// ── Hoisted handle arrays ───────────────────────────────────────────────
const CONSTANT_ASSIGNMENT_HANDLES = [propInput("Prop", "Prop"), assignmentOutput()];
const FIELD_FUNCTION_ASSIGNMENT_HANDLES = [
  densityInput("FieldFunction", "Field Fn"),
  assignmentInput("Assignments[0]", "Assign 0"),
  assignmentInput("Assignments[1]", "Assign 1"),
  assignmentOutput(),
];
const SANDWICH_ASSIGNMENT_HANDLES = [
  assignmentInput("Top", "Top"),
  assignmentInput("Bottom", "Bottom"),
  assignmentOutput(),
];
const ASSIGNMENT_OUTPUT_HANDLES = [assignmentOutput()];

export const ConstantAssignmentNode = memo(function ConstantAssignmentNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Assignment}
      handles={CONSTANT_ASSIGNMENT_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Constant assignment</div>
    </BaseNode>
  );
});

export const FieldFunctionAssignmentNode = memo(function FieldFunctionAssignmentNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Assignment}
      handles={FIELD_FUNCTION_ASSIGNMENT_HANDLES}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Threshold</span>
        <span>{safeDisplay(data.fields.Threshold, 0.5)}</span>
      </div>
    </BaseNode>
  );
});

export const SandwichAssignmentNode = memo(function SandwichAssignmentNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Assignment}
      handles={SANDWICH_ASSIGNMENT_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Sandwich</div>
    </BaseNode>
  );
});

export const WeightedAssignmentNode = memo(function WeightedAssignmentNode(props: TypedNodeProps) {
  const handles = useCompoundHandles(props.id, "Assignment:Weighted");
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Assignment}
      handles={handles}
    >
      <div className="text-tn-text-muted text-center py-1">Weighted</div>
    </BaseNode>
  );
});

export const ImportedAssignmentNode = memo(function ImportedAssignmentNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Assignment} handles={ASSIGNMENT_OUTPUT_HANDLES}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Name</span>
        <span className="truncate max-w-[120px]">{safeDisplay(data.fields.Name, "")}</span>
      </div>
    </BaseNode>
  );
});
