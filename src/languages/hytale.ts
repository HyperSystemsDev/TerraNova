import type { LanguageDefinition } from "./types";
import { INTERNAL_TO_HYTALE_TYPES } from "@/utils/translationMaps";

const safeInverse = (v: number): number => (v === 0 ? 0 : 1 / v);

export const hytaleLanguage: LanguageDefinition = {
  id: "hytale",
  displayName: "Hytale",
  description:
    "Exact Hytale worldgen names and terminology. Matches the official documentation and JSON format 1:1.",

  typeDisplayNames: { ...INTERNAL_TO_HYTALE_TYPES },

  fieldDisplayNames: {
    Clamp: { Min: "WallB", Max: "WallA" },
    SmoothClamp: { Min: "WallB", Max: "WallA" },
    RotatedPosition: { AngleDegrees: "SpinAngle" },
    DomainWarp2D: { Amplitude: "WarpFactor" },
    DomainWarp3D: { Amplitude: "WarpFactor" },
    SimplexNoise2D: { Gain: "Persistence" },
    SimplexNoise3D: { Gain: "Persistence" },
  },

  fieldTransforms: {
    SimplexNoise2D: {
      Frequency: {
        displayName: "Scale",
        toDisplay: safeInverse,
        fromDisplay: safeInverse,
      },
    },
    SimplexNoise3D: {
      Frequency: {
        displayName: "Scale",
        toDisplay: safeInverse,
        fromDisplay: safeInverse,
      },
    },
    VoronoiNoise2D: {
      Frequency: {
        displayName: "Scale",
        toDisplay: safeInverse,
        fromDisplay: safeInverse,
      },
    },
    VoronoiNoise3D: {
      Frequency: {
        displayName: "Scale",
        toDisplay: safeInverse,
        fromDisplay: safeInverse,
      },
    },
  },

  hiddenTypes: new Set([
    "SimplexRidgeNoise2D",
    "SimplexRidgeNoise3D",
    "FractalNoise2D",
    "FractalNoise3D",
    "GradientDensity",
    "LinearTransform",
    "Conditional",
    "HeightGradient",
    "DensityBased",
    "DomainWarp3D",
  ]),
};
