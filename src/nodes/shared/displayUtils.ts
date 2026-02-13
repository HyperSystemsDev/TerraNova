/**
 * Safely render a node field value. Handles the case where a field
 * expected to be a scalar (number/string) is actually an object
 * (e.g. {x, y, z} vector), preventing React error #31.
 */
export function safeDisplay(value: unknown, fallback: string | number = "\u2014"): string | number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
