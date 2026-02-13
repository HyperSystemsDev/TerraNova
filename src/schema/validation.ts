export type Severity = "error" | "warning" | "info";

export interface FieldConstraint {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  oneOf?: string[];
  message?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: Severity;
}

/**
 * Validate a single field value against its constraint.
 */
export function validateField(
  fieldName: string,
  value: unknown,
  constraint: FieldConstraint,
): ValidationIssue | null {
  if (constraint.required && (value === undefined || value === null || value === "")) {
    return {
      field: fieldName,
      message: constraint.message ?? `${fieldName} is required`,
      severity: "error",
    };
  }

  if (value === undefined || value === null) return null;

  if (typeof value === "number") {
    if (constraint.min !== undefined && value < constraint.min) {
      return {
        field: fieldName,
        message: constraint.message ?? `${fieldName} must be >= ${constraint.min}`,
        severity: "error",
      };
    }
    if (constraint.max !== undefined && value > constraint.max) {
      return {
        field: fieldName,
        message: constraint.message ?? `${fieldName} must be <= ${constraint.max}`,
        severity: "error",
      };
    }
  }

  if (typeof value === "string") {
    if (constraint.pattern && !constraint.pattern.test(value)) {
      return {
        field: fieldName,
        message: constraint.message ?? `${fieldName} does not match expected format`,
        severity: "error",
      };
    }
    if (constraint.oneOf && !constraint.oneOf.includes(value)) {
      return {
        field: fieldName,
        message: constraint.message ?? `${fieldName} must be one of: ${constraint.oneOf.join(", ")}`,
        severity: "error",
      };
    }
  }

  return null;
}

/**
 * Validate a set of fields against their constraints.
 */
export function validateFields(
  fields: Record<string, unknown>,
  constraints: Record<string, FieldConstraint>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [field, constraint] of Object.entries(constraints)) {
    const issue = validateField(field, fields[field], constraint);
    if (issue) issues.push(issue);
  }

  return issues;
}
