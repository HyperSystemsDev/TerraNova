import type { BaseFields } from "./types";

/**
 * All V2 Vector Provider types.
 */
export type VectorProviderType =
  | "Constant"
  | "DensityGradient"
  | "Cache"
  | "Exported"
  | "Imported";

export interface VectorProviderFields extends BaseFields {
  Type: VectorProviderType;
}

export interface ConstantVector extends VectorProviderFields {
  Type: "Constant";
  Value?: { x: number; y: number; z: number };
}

export interface DensityGradientVector extends VectorProviderFields {
  Type: "DensityGradient";
  DensityFunction?: unknown;
}

export interface CacheVector extends VectorProviderFields {
  Type: "Cache";
  VectorProvider?: VectorProviderFields;
}

export type AnyVectorProvider =
  | ConstantVector
  | DensityGradientVector
  | CacheVector
  | VectorProviderFields;
