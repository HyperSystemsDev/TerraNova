import type { BaseFields, RangeDouble } from "./types";

/**
 * All 68 V2 Density Function types.
 * Each type name matches the V2 JSON "Type" field exactly.
 */
export type DensityType =
  // Core noise
  | "SimplexNoise2D"
  | "SimplexNoise3D"
  | "SimplexRidgeNoise2D"
  | "SimplexRidgeNoise3D"
  | "VoronoiNoise2D"
  | "VoronoiNoise3D"
  // Arithmetic
  | "Sum"
  | "SumSelf"
  | "WeightedSum"
  | "Product"
  | "Negate"
  | "Abs"
  | "SquareRoot"
  | "CubeRoot"
  | "Square"
  | "CubeMath"
  | "Inverse"
  | "Modulo"
  // Constants & references
  | "Constant"
  | "ImportedValue"
  // Clamping & range
  | "Clamp"
  | "ClampToIndex"
  | "Normalizer"
  | "DoubleNormalizer"
  | "RangeChoice"
  | "LinearTransform"
  | "Interpolate"
  // Position-based
  | "CoordinateX"
  | "CoordinateY"
  | "CoordinateZ"
  | "DistanceFromOrigin"
  | "DistanceFromAxis"
  | "DistanceFromPoint"
  | "AngleFromOrigin"
  | "AngleFromPoint"
  | "HeightAboveSurface"
  // Curves & splines
  | "CurveFunction"
  | "SplineFunction"
  | "FlatCache"
  // Combinators
  | "Conditional"
  | "Switch"
  | "Blend"
  | "BlendCurve"
  | "MinFunction"
  | "MaxFunction"
  | "AverageFunction"
  // Sampling / transforms
  | "CacheOnce"
  | "Wrap"
  | "TranslatedPosition"
  | "ScaledPosition"
  | "RotatedPosition"
  | "MirroredPosition"
  | "QuantizedPosition"
  // Terrain-specific
  | "SurfaceDensity"
  | "TerrainBoolean"
  | "TerrainMask"
  | "GradientDensity"
  | "BeardDensity"
  | "ColumnDensity"
  | "CaveDensity"
  | "FractalNoise2D"
  | "FractalNoise3D"
  | "DomainWarp2D"
  | "DomainWarp3D"
  // Smooth operations
  | "SmoothClamp"
  | "SmoothFloor"
  | "SmoothMin"
  | "SmoothMax"
  // Additional math
  | "AmplitudeConstant"
  | "Pow"
  | "Floor"
  | "Ceiling"
  // Position overrides & sampling
  | "Anchor"
  | "YOverride"
  | "XOverride"
  | "ZOverride"
  | "BaseHeight"
  | "Offset"
  | "Distance"
  | "PositionsCellNoise"
  // Additional operations
  | "SmoothCeiling"
  | "Gradient"
  | "Amplitude"
  | "YSampled"
  | "SwitchState"
  | "Positions3D"
  | "PositionsPinch"
  | "PositionsTwist"
  // Warp types
  | "GradientWarp"
  | "VectorWarp"
  // Context-dependent
  | "Terrain"
  | "CellWallDistance"
  | "DistanceToBiomeEdge"
  | "Pipeline"
  // New pre-release types
  | "OffsetConstant"
  | "Cache2D"
  | "Exported"
  | "Angle"
  // Shape SDFs
  | "Cube"
  | "Axis"
  | "Ellipsoid"
  | "Cuboid"
  | "Cylinder"
  | "Plane"
  | "Shell"
  // Special
  | "Debug"
  | "YGradient"
  | "Passthrough"
  | "Zero"
  | "One";

/** Base density function fields */
export interface DensityFields extends BaseFields {
  Type: DensityType;
}

/** Noise parameters shared by simplex/voronoi types */
export interface NoiseParams {
  Frequency?: number;
  Seed?: number | string;
  Octaves?: number;
  Lacunarity?: number;
  Gain?: number;
}

/** SimplexNoise2D/3D */
export interface SimplexNoise extends DensityFields, NoiseParams {
  Type: "SimplexNoise2D" | "SimplexNoise3D";
  Amplitude?: number;
}

/** Constant value */
export interface ConstantDensity extends DensityFields {
  Type: "Constant";
  Value?: number;
}

/** Sum of multiple inputs */
export interface SumDensity extends DensityFields {
  Type: "Sum";
  Inputs?: DensityFields[];
}

/** Weighted sum */
export interface WeightedSumDensity extends DensityFields {
  Type: "WeightedSum";
  Inputs?: DensityFields[];
  Weights?: number[];
}

/** Clamp input between min and max */
export interface ClampDensity extends DensityFields {
  Type: "Clamp";
  Input?: DensityFields;
  Min?: number;
  Max?: number;
}

/** Normalize input from source range to target range */
export interface NormalizerDensity extends DensityFields {
  Type: "Normalizer";
  Input?: DensityFields;
  SourceRange?: RangeDouble;
  TargetRange?: RangeDouble;
}

/** Linear transform: value * scale + offset */
export interface LinearTransformDensity extends DensityFields {
  Type: "LinearTransform";
  Input?: DensityFields;
  Scale?: number;
  Offset?: number;
}

/** Conditional branching */
export interface ConditionalDensity extends DensityFields {
  Type: "Conditional";
  Condition?: DensityFields;
  Threshold?: number;
  TrueInput?: DensityFields;
  FalseInput?: DensityFields;
}

/** Product of multiple inputs */
export interface ProductDensity extends DensityFields {
  Type: "Product";
  Inputs?: DensityFields[];
}

/** Negate input */
export interface NegateDensity extends DensityFields {
  Type: "Negate";
  Input?: DensityFields;
}

/** Interpolate between two inputs */
export interface InterpolateDensity extends DensityFields {
  Type: "Interpolate";
  InputA?: DensityFields;
  InputB?: DensityFields;
  Factor?: DensityFields;
}

/** Y-axis gradient */
export interface YGradientDensity extends DensityFields {
  Type: "YGradient";
  FromY?: number;
  ToY?: number;
}

/** Curve function: applies a curve to an input */
export interface CurveFunctionDensity extends DensityFields {
  Type: "CurveFunction";
  Input?: DensityFields;
  Curve?: unknown;
}

/** Union of all density types for type narrowing */
export type AnyDensity =
  | SimplexNoise
  | ConstantDensity
  | SumDensity
  | WeightedSumDensity
  | ClampDensity
  | NormalizerDensity
  | LinearTransformDensity
  | ConditionalDensity
  | ProductDensity
  | NegateDensity
  | InterpolateDensity
  | YGradientDensity
  | CurveFunctionDensity
  | DensityFields;
