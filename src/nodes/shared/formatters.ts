import type { RangeDouble } from "@/schema/types";

export function formatRange(r: unknown): string {
  if (r && typeof r === "object" && "Min" in (r as Record<string, unknown>)) {
    const range = r as RangeDouble;
    return `[${range.Min}, ${range.Max}]`;
  }
  return "—";
}

export function formatVec3(v: unknown): string {
  if (v && typeof v === "object" && "x" in (v as Record<string, unknown>)) {
    const vec = v as { x: number; y: number; z: number };
    return `(${vec.x}, ${vec.y}, ${vec.z})`;
  }
  return "—";
}
