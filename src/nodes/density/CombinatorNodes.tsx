import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityInput, densityOutput, curveInput } from "@/nodes/shared/handles";

const CONDITIONAL_HANDLES = [
  densityInput("Condition", "Condition"),
  densityInput("TrueInput", "True"),
  densityInput("FalseInput", "False"),
  densityOutput(),
];
const SWITCH_HANDLES = [densityInput("Inputs[0]", "Case 0"), densityInput("Inputs[1]", "Case 1"), densityOutput()];
const BLEND_HANDLES = [
  densityInput("InputA", "Input A"),
  densityInput("InputB", "Input B"),
  densityInput("Factor", "Factor"),
  densityOutput(),
];
const BLEND_CURVE_HANDLES = [
  densityInput("InputA", "Input A"),
  densityInput("InputB", "Input B"),
  densityInput("Factor", "Factor"),
  curveInput("Curve", "Curve"),
  densityOutput(),
];
const AB_INPUT_HANDLES = [densityInput("Inputs[0]", "Input A"), densityInput("Inputs[1]", "Input B"), densityOutput()];

export const ConditionalNode = memo(function ConditionalNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={CONDITIONAL_HANDLES}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Threshold</span>
        <span>{data.fields.Threshold ?? 0}</span>
      </div>
    </BaseNode>
  );
});

export const SwitchNode = memo(function SwitchNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={SWITCH_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Switch</div>
    </BaseNode>
  );
});

export const BlendNode = memo(function BlendNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={BLEND_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Blend A↔B</div>
    </BaseNode>
  );
});

export const BlendCurveNode = memo(function BlendCurveNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={BLEND_CURVE_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Blend via curve</div>
    </BaseNode>
  );
});

export const MinFunctionNode = memo(function MinFunctionNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={AB_INPUT_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">min(A, B)</div>
    </BaseNode>
  );
});

export const MaxFunctionNode = memo(function MaxFunctionNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={AB_INPUT_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">max(A, B)</div>
    </BaseNode>
  );
});

export const AverageFunctionNode = memo(function AverageFunctionNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.Density}
      handles={AB_INPUT_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">avg(A, B)</div>
    </BaseNode>
  );
});
