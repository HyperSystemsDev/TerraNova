# Hytale 3D Voxel Preview — Implementation Guide

## Overview

TerraNova's Voxel Preview evaluates a density node graph across a 3D volume, thresholds the results into solid/air blocks, resolves materials using SpaceAndDepth layer rules, and renders the result as a Minecraft-style voxel scene using `InstancedMesh` in React Three Fiber.

## Architecture

```
Node Graph (nodes/edges)
    │
    ▼
Volume Evaluator (volumeEvaluator.ts)
    │  Float32Array[n*n*ySlices]  (Y-major: densities[y*n*n + z*n + x])
    ▼
Voxel Extractor (voxelExtractor.ts)
    │  Surface voxels only (6-face air-neighbor check)
    ▼
Material Resolver (materialResolver.ts)
    │  Depth-from-surface → SpaceAndDepth layer rules
    ▼
VoxelPreview3D (React Three Fiber)
    │  One InstancedMesh per material color
    ▼
Screen
```

## Volume Layout

Densities are stored in a flat `Float32Array` with Y-major ordering:

```
index = y * resolution * resolution + z * resolution + x
```

Where:
- `x, z` ∈ [0, resolution) map to world coordinates [rangeMin, rangeMax]
- `y` ∈ [0, ySlices) maps to world Y coordinates [yMin, yMax]

## Solid/Air Threshold

A voxel is **solid** when `density >= 0` and **air** when `density < 0`. This matches Hytale's terrain generation convention where positive density means "inside terrain."

## Surface Voxel Extraction

Only voxels that have at least one air neighbor (6-face check: ±X, ±Y, ±Z) are rendered. This dramatically reduces the instance count since interior voxels are never visible.

## Material Resolution

Materials are assigned by depth from the terrain surface:

1. For each solid voxel, scan upward in its column until air is found → depth from surface
2. Walk material layers from `extractMaterialLayers()`:
   - Layer 0 (surface, ~3 blocks): grass/moss
   - Layer 1 (subsurface, ~5 blocks): dirt/soil
   - Layer 2 (deep, 8+ blocks): stone/rock
3. Fallback heuristic if no material section: depth 0-1=grass, 2-5=dirt, 6+=stone

## Progressive Resolution

Evaluation runs at increasing resolution for responsive UX:
1. 16^3 → immediate feedback (~100ms)
2. 32^3 → medium detail (~500ms)
3. 64^3 → full detail (~2s)

Each step replaces the previous result. Changing parameters restarts from step 1.

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/volumeEvaluator.ts` | 3D grid evaluation using density node graph |
| `src/workers/volumeWorker.ts` | Web Worker wrapper for volume evaluation |
| `src/utils/volumeWorkerClient.ts` | Worker client with evaluate/cancel API |
| `src/utils/voxelExtractor.ts` | Surface voxel extraction + material grouping |
| `src/utils/materialResolver.ts` | Depth-from-surface material assignment |
| `src/components/preview/VoxelPreview3D.tsx` | R3F InstancedMesh renderer |
| `src/components/preview/ThresholdedHeatmap.tsx` | Binary solid/air 2D view |
| `src/hooks/useVoxelEvaluation.ts` | Evaluation orchestration hook |
| `src/components/preview/MaterialLegend.tsx` | Material color legend overlay |
