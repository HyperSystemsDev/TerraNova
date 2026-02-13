import type { BaseFields } from "./types";

/**
 * All V2 Assignment types.
 */
export type AssignmentType =
  | "Constant"
  | "FieldFunction"
  | "Sandwich"
  | "Weighted"
  | "Imported";

export interface AssignmentFields extends BaseFields {
  Type: AssignmentType;
}

export interface ConstantAssignment extends AssignmentFields {
  Type: "Constant";
  Prop?: unknown;
}

export interface FieldFunctionAssignment extends AssignmentFields {
  Type: "FieldFunction";
  FieldFunction?: unknown;
  Assignments?: AssignmentFields[];
}

export interface SandwichAssignment extends AssignmentFields {
  Type: "Sandwich";
  Top?: AssignmentFields;
  Bottom?: AssignmentFields;
}

export interface WeightedAssignment extends AssignmentFields {
  Type: "Weighted";
  Entries?: Array<{ Assignment?: AssignmentFields; Weight?: number }>;
}

export type AnyAssignment =
  | ConstantAssignment
  | FieldFunctionAssignment
  | SandwichAssignment
  | WeightedAssignment
  | AssignmentFields;
