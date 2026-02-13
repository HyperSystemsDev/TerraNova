import type { ConditionType, ConditionParameterType, LayerType } from "@/schema/material";

export const LAYER_TYPES: LayerType[] = [
  "ConstantThickness",
  "NoiseThickness",
  "RangeThickness",
  "WeightedThickness",
];

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  ConstantThickness: "Constant",
  NoiseThickness: "Noise",
  RangeThickness: "Range",
  WeightedThickness: "Weighted",
};

export const CONDITION_TYPES: ConditionType[] = [
  "AlwaysTrueCondition",
  "AndCondition",
  "OrCondition",
  "NotCondition",
  "EqualsCondition",
  "GreaterThanCondition",
  "SmallerThanCondition",
];

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  AlwaysTrueCondition: "Always True",
  AndCondition: "And",
  OrCondition: "Or",
  NotCondition: "Not",
  EqualsCondition: "Equals",
  GreaterThanCondition: "Greater Than",
  SmallerThanCondition: "Smaller Than",
};

export const CONDITION_PARAMS: ConditionParameterType[] = [
  "SPACE_ABOVE_FLOOR",
  "SPACE_BELOW_CEILING",
];

export const LAYER_CONTEXT_OPTIONS = [
  "DEPTH_INTO_FLOOR",
  "DEPTH_INTO_CEILING",
] as const;

export const ROLE_COLORS: Record<string, string> = {
  Solid: "#5B8DBF",
  Empty: "#A67EB8",
  Low: "#C87D3A",
  High: "#C76B6B",
  True: "#6B9E5A",
  False: "#D46A4A",
  Root: "#7B8E92",
};
