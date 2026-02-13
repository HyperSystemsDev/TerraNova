import type { BaseFields } from "./types";

/**
 * V2 Environment Provider types.
 */
export type EnvironmentProviderType =
  | "Default"
  | "Biome"
  | "Constant"
  | "DensityDelimited"
  | "Imported"
  | "Exported";

export interface EnvironmentProviderFields extends BaseFields {
  Type: EnvironmentProviderType;
}

/**
 * V2 Tint Provider types.
 */
export type TintProviderType =
  | "Constant"
  | "Gradient"
  | "DensityDelimited"
  | "Imported"
  | "Exported";

export interface TintProviderFields extends BaseFields {
  Type: TintProviderType;
}

export interface ConstantTint extends TintProviderFields {
  Type: "Constant";
  Color?: string;
}

export interface GradientTint extends TintProviderFields {
  Type: "Gradient";
  From?: string;
  To?: string;
}

/**
 * V2 Block Mask types.
 */
export type BlockMaskType =
  | "All"
  | "None"
  | "Single"
  | "Set"
  | "Imported";

export interface BlockMaskFields extends BaseFields {
  Type: BlockMaskType;
}

/**
 * V2 Directionality types.
 */
export type DirectionalityType =
  | "Uniform"
  | "Directional"
  | "Normal"
  | "Static"
  | "Random"
  | "Pattern"
  | "Imported";

export interface DirectionalityFields extends BaseFields {
  Type: DirectionalityType;
}
