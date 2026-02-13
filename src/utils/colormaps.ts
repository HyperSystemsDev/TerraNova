export type ColormapId = "blue-red" | "grayscale" | "terrain" | "viridis" | "red-black";

export interface Colormap {
  id: ColormapId;
  label: string;
  /** Returns [r, g, b] in 0-255 range for canvas ImageData. */
  ramp: (t: number) => [number, number, number];
  /** Returns [r, g, b] in 0-1 range for Three.js vertex colors. */
  rampVec: (t: number) => [number, number, number];
  /** CSS linear-gradient string for legend bar. */
  cssGradient: string;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function toVec(fn: (t: number) => [number, number, number]): (t: number) => [number, number, number] {
  return (t) => {
    const [r, g, b] = fn(t);
    return [r / 255, g / 255, b / 255];
  };
}

// ── Blue-Red (existing) ─────────────────────────────────────────────────

function blueRedRamp(t: number): [number, number, number] {
  const c = clamp01(t);
  if (c < 0.25) {
    const f = c / 0.25;
    return [0, Math.round(f * 255), 255];
  } else if (c < 0.5) {
    const f = (c - 0.25) / 0.25;
    return [0, 255, Math.round((1 - f) * 255)];
  } else if (c < 0.75) {
    const f = (c - 0.5) / 0.25;
    return [Math.round(f * 255), 255, 0];
  } else {
    const f = (c - 0.75) / 0.25;
    return [255, Math.round((1 - f) * 255), 0];
  }
}

// ── Grayscale ───────────────────────────────────────────────────────────

function grayscaleRamp(t: number): [number, number, number] {
  const v = Math.round(clamp01(t) * 255);
  return [v, v, v];
}

// ── Terrain ─────────────────────────────────────────────────────────────

function terrainRamp(t: number): [number, number, number] {
  const c = clamp01(t);
  // deep blue → blue → green → brown → white
  if (c < 0.2) {
    const f = c / 0.2;
    return [Math.round(f * 30), Math.round(30 + f * 70), Math.round(100 + f * 155)];
  } else if (c < 0.4) {
    const f = (c - 0.2) / 0.2;
    return [Math.round(30 + f * 20), Math.round(100 + f * 100), Math.round(255 - f * 205)];
  } else if (c < 0.6) {
    const f = (c - 0.4) / 0.2;
    return [Math.round(50 + f * 90), Math.round(200 - f * 50), Math.round(50 - f * 20)];
  } else if (c < 0.8) {
    const f = (c - 0.6) / 0.2;
    return [Math.round(140 + f * 60), Math.round(150 - f * 50), Math.round(30 + f * 30)];
  } else {
    const f = (c - 0.8) / 0.2;
    return [Math.round(200 + f * 55), Math.round(100 + f * 155), Math.round(60 + f * 195)];
  }
}

// ── Viridis ─────────────────────────────────────────────────────────────

function viridisRamp(t: number): [number, number, number] {
  const c = clamp01(t);
  // Approximation of viridis: purple → teal → yellow
  if (c < 0.25) {
    const f = c / 0.25;
    return [Math.round(68 + f * (-2)), Math.round(1 + f * 53), Math.round(84 + f * 38)];
  } else if (c < 0.5) {
    const f = (c - 0.25) / 0.25;
    return [Math.round(66 - f * 33), Math.round(54 + f * 73), Math.round(122 + f * 7)];
  } else if (c < 0.75) {
    const f = (c - 0.5) / 0.25;
    return [Math.round(33 + f * 61), Math.round(127 + f * 63), Math.round(129 - f * 40)];
  } else {
    const f = (c - 0.75) / 0.25;
    return [Math.round(94 + f * 159), Math.round(190 + f * 38), Math.round(89 - f * 69)];
  }
}

// ── Red-Black ───────────────────────────────────────────────────────────

function redBlackRamp(t: number): [number, number, number] {
  const c = clamp01(t);
  return [Math.round(c * 255), Math.round(c * c * 60), Math.round(c * c * 20)];
}

// ── Registry ────────────────────────────────────────────────────────────

export const COLORMAPS: Colormap[] = [
  {
    id: "blue-red",
    label: "Blue-Red",
    ramp: blueRedRamp,
    rampVec: toVec(blueRedRamp),
    cssGradient: "linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)",
  },
  {
    id: "grayscale",
    label: "Grayscale",
    ramp: grayscaleRamp,
    rampVec: toVec(grayscaleRamp),
    cssGradient: "linear-gradient(to right, #000000, #ffffff)",
  },
  {
    id: "terrain",
    label: "Terrain",
    ramp: terrainRamp,
    rampVec: toVec(terrainRamp),
    cssGradient: "linear-gradient(to right, #001e64, #1e649b, #32c832, #8c9632, #c8649b, #ffffff)",
  },
  {
    id: "viridis",
    label: "Viridis",
    ramp: viridisRamp,
    rampVec: toVec(viridisRamp),
    cssGradient: "linear-gradient(to right, #440154, #423e7a, #21918c, #5ec962, #fde725)",
  },
  {
    id: "red-black",
    label: "Red-Black",
    ramp: redBlackRamp,
    rampVec: toVec(redBlackRamp),
    cssGradient: "linear-gradient(to right, #000000, #800000, #ff3c14)",
  },
];

export function getColormap(id: ColormapId): Colormap {
  return COLORMAPS.find((c) => c.id === id) ?? COLORMAPS[0];
}
