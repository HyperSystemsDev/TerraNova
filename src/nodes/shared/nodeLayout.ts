import { Position } from "@xyflow/react";
import type { FlowDirection } from "@/constants";

export const HEADER_H = 32; // px-3 py-1.5 + text-xs line-height
export const ROW_H = 28; // each handle row

/** Handle top position relative to the handle zone container */
export function handleTop(rowIndex: number): number {
  return rowIndex * ROW_H + ROW_H / 2;
}

/** Which side inputs appear on for a given flow direction */
export function inputPosition(dir: FlowDirection): Position {
  return dir === "RL" ? Position.Right : Position.Left;
}

/** Which side outputs appear on for a given flow direction */
export function outputPosition(dir: FlowDirection): Position {
  return dir === "RL" ? Position.Left : Position.Right;
}

/** CSS side keyword for input handles */
export function inputSide(dir: FlowDirection): "left" | "right" {
  return dir === "RL" ? "right" : "left";
}

/** CSS side keyword for output handles */
export function outputSide(dir: FlowDirection): "left" | "right" {
  return dir === "RL" ? "left" : "right";
}
