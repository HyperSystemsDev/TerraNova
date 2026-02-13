import type { BaseFields, RangeDouble } from "./types";

/**
 * All V2 Curve types.
 */
export type CurveType =
  | "Manual"
  | "Constant"
  | "DistanceExponential"
  | "DistanceS"
  | "Multiplier"
  | "Sum"
  | "Inverter"
  | "Not"
  | "Clamp"
  | "LinearRemap"
  | "Noise"
  | "Cache"
  | "Blend"
  | "StepFunction"
  | "Threshold"
  | "SmoothStep"
  | "Power"
  | "Floor"
  | "Ceiling"
  | "SmoothFloor"
  | "SmoothCeiling"
  | "SmoothClamp"
  | "Min"
  | "Max"
  | "SmoothMin"
  | "SmoothMax"
  | "Imported"
  | "Exported";

export interface CurveFields extends BaseFields {
  Type: CurveType;
}

export interface ManualCurve extends CurveFields {
  Type: "Manual";
  Points?: Array<{ x: number; y: number }>;
}

export interface ConstantCurve extends CurveFields {
  Type: "Constant";
  Value?: number;
}

export interface DistanceExponentialCurve extends CurveFields {
  Type: "DistanceExponential";
  Exponent?: number;
  Range?: RangeDouble;
}

export interface DistanceSCurve extends CurveFields {
  Type: "DistanceS";
  Range?: RangeDouble;
}

export interface MultiplierCurve extends CurveFields {
  Type: "Multiplier";
  Inputs?: CurveFields[];
}

export interface SumCurve extends CurveFields {
  Type: "Sum";
  Inputs?: CurveFields[];
}

export interface InverterCurve extends CurveFields {
  Type: "Inverter";
  Input?: CurveFields;
}

export interface ClampCurve extends CurveFields {
  Type: "Clamp";
  Input?: CurveFields;
  Min?: number;
  Max?: number;
}

export interface LinearRemapCurve extends CurveFields {
  Type: "LinearRemap";
  Input?: CurveFields;
  SourceRange?: RangeDouble;
  TargetRange?: RangeDouble;
}

export type AnyCurve =
  | ManualCurve
  | ConstantCurve
  | DistanceExponentialCurve
  | DistanceSCurve
  | MultiplierCurve
  | SumCurve
  | InverterCurve
  | ClampCurve
  | LinearRemapCurve
  | CurveFields;
