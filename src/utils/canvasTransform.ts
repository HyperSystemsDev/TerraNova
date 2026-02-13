import type { CanvasTransform } from "@/stores/previewStore";

/**
 * Convert screen (pixel) coordinates to world coordinates,
 * accounting for the current pan/zoom transform.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  transform: CanvasTransform,
  canvasSize: number,
  rangeMin: number,
  rangeMax: number,
): { x: number; z: number } {
  const range = rangeMax - rangeMin;
  // Canvas center in screen coords
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  // Undo transform: screen → normalized (0-1) → world
  const normX = ((screenX - cx - transform.offsetX) / transform.scale + cx) / canvasSize;
  const normZ = ((screenY - cy - transform.offsetY) / transform.scale + cy) / canvasSize;
  return {
    x: rangeMin + normX * range,
    z: rangeMin + normZ * range,
  };
}

/**
 * Convert world coordinates to screen (pixel) coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldZ: number,
  transform: CanvasTransform,
  canvasSize: number,
  rangeMin: number,
  rangeMax: number,
): { sx: number; sy: number } {
  const range = rangeMax - rangeMin;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const normX = (worldX - rangeMin) / range;
  const normZ = (worldZ - rangeMin) / range;
  const sx = (normX * canvasSize - cx) * transform.scale + cx + transform.offsetX;
  const sy = (normZ * canvasSize - cy) * transform.scale + cy + transform.offsetY;
  return { sx, sy };
}
