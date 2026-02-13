import type { BaseFields, RangeDouble } from "./types";

/**
 * All V2 Material Provider types.
 */
export type MaterialProviderType =
  | "Constant"
  | "SpaceAndDepth"
  | "WeightedRandom"
  | "Conditional"
  | "Blend"
  | "HeightGradient"
  | "NoiseSelector"
  | "Solid"
  | "Empty"
  | "Surface"
  | "Cave"
  | "Cluster"
  | "Queue"
  | "FieldFunction"
  | "Solidity"
  | "DownwardDepth"
  | "UpwardDepth"
  | "DownwardSpace"
  | "UpwardSpace"
  | "Striped"
  | "TerrainDensity"
  | "Imported"
  | "Exported"
  // Layer sub-asset types (used within SpaceAndDepth.Layers[])
  | "ConstantThickness"
  | "NoiseThickness"
  | "RangeThickness"
  | "WeightedThickness";

/* ── Layer types ───────────────────────────────────────────────────── */

export type LayerType =
  | "ConstantThickness"
  | "NoiseThickness"
  | "RangeThickness"
  | "WeightedThickness";

export type LayerContextType = "DEPTH_INTO_FLOOR" | "DEPTH_INTO_CEILING";

/* ── Condition types ───────────────────────────────────────────────── */

export type ConditionType =
  | "AlwaysTrueCondition"
  | "AndCondition"
  | "OrCondition"
  | "NotCondition"
  | "EqualsCondition"
  | "GreaterThanCondition"
  | "SmallerThanCondition";

export type ConditionParameterType = "SPACE_ABOVE_FLOOR" | "SPACE_BELOW_CEILING";

/* ── Layer interfaces ──────────────────────────────────────────────── */

export interface ConstantThicknessLayer {
  Type: "ConstantThickness";
  Thickness: number;
  Material?: unknown; // nested MaterialProviderAsset (via edge)
}

export interface NoiseThicknessLayer {
  Type: "NoiseThickness";
  ThicknessFunctionXZ?: unknown; // nested DensityAsset (via edge)
  Material?: unknown; // nested MaterialProviderAsset (via edge)
}

export interface RangeThicknessLayer {
  Type: "RangeThickness";
  RangeMin: number;
  RangeMax: number;
  Seed: string;
  Material?: unknown; // nested MaterialProviderAsset (via edge)
}

export interface WeightedThicknessEntry {
  Weight: number;
  Thickness: number;
}

export interface WeightedThicknessLayer {
  Type: "WeightedThickness";
  PossibleThicknesses: WeightedThicknessEntry[];
  Seed: string;
  Material?: unknown; // nested MaterialProviderAsset (via edge)
}

export type AnyLayer =
  | ConstantThicknessLayer
  | NoiseThicknessLayer
  | RangeThicknessLayer
  | WeightedThicknessLayer;

/* ── Condition interfaces ──────────────────────────────────────────── */

export interface AlwaysTrueCondition {
  Type: "AlwaysTrueCondition";
}

export interface AndCondition {
  Type: "AndCondition";
  Conditions?: unknown[];
}

export interface OrCondition {
  Type: "OrCondition";
  Conditions?: unknown[];
}

export interface NotCondition {
  Type: "NotCondition";
  Condition?: unknown;
}

export interface EqualsCondition {
  Type: "EqualsCondition";
  ContextToCheck: ConditionParameterType;
  Value: number;
}

export interface GreaterThanCondition {
  Type: "GreaterThanCondition";
  ContextToCheck: ConditionParameterType;
  Threshold: number;
}

export interface SmallerThanCondition {
  Type: "SmallerThanCondition";
  ContextToCheck: ConditionParameterType;
  Threshold: number;
}

export type AnyCondition =
  | AlwaysTrueCondition
  | AndCondition
  | OrCondition
  | NotCondition
  | EqualsCondition
  | GreaterThanCondition
  | SmallerThanCondition;

/* ── Material Provider interfaces ──────────────────────────────────── */

export interface MaterialProviderFields extends BaseFields {
  Type: MaterialProviderType;
}

export interface ConstantMaterial extends MaterialProviderFields {
  Type: "Constant";
  Material?: string;
}

export interface SpaceAndDepthMaterial extends MaterialProviderFields {
  Type: "SpaceAndDepth";
  // V2 fields
  LayerContext?: LayerContextType;
  MaxExpectedDepth?: number;
  Condition?: AnyCondition;
  Layers?: AnyLayer[];
  // V1 backward-compat fields
  Solid?: MaterialProviderFields;
  Empty?: MaterialProviderFields;
  DepthThreshold?: number;
}

export interface WeightedRandomMaterial extends MaterialProviderFields {
  Type: "WeightedRandom";
  Entries?: Array<{ Material?: MaterialProviderFields; Weight?: number }>;
}

export interface ConditionalMaterial extends MaterialProviderFields {
  Type: "Conditional";
  Condition?: unknown;
  TrueInput?: MaterialProviderFields;
  FalseInput?: MaterialProviderFields;
  Threshold?: number;
}

export interface BlendMaterial extends MaterialProviderFields {
  Type: "Blend";
  InputA?: MaterialProviderFields;
  InputB?: MaterialProviderFields;
  Factor?: unknown;
}

export interface HeightGradientMaterial extends MaterialProviderFields {
  Type: "HeightGradient";
  Range?: RangeDouble;
  Low?: MaterialProviderFields;
  High?: MaterialProviderFields;
}

export type AnyMaterialProvider =
  | ConstantMaterial
  | SpaceAndDepthMaterial
  | WeightedRandomMaterial
  | ConditionalMaterial
  | BlendMaterial
  | HeightGradientMaterial
  | MaterialProviderFields;
