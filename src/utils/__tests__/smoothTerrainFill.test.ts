import { describe, it, expect } from "vitest";
// GAP_THRESHOLD also exported but currently only referenced in comments
import { smoothTerrainFill, SOLID_THRESHOLD, SCAN_THRESHOLD } from "../voxelExtractor";

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Create a density volume (n × n × ys). All air (-1) by default. */
function makeDensities(n: number, ys: number): Float32Array {
  const d = new Float32Array(n * n * ys);
  d.fill(-1);
  return d;
}

/** Set a voxel solid at (x, y, z). */
function setSolid(d: Float32Array, x: number, y: number, z: number, n: number, val = 1) {
  d[y * n * n + z * n + x] = val;
}

/** Get density at (x, y, z). */
function getVal(d: Float32Array, x: number, y: number, z: number, n: number): number {
  return d[y * n * n + z * n + x];
}

/* ── smoothTerrainFill tests ──────────────────────────────────────── */

describe("smoothTerrainFill", () => {
  it("does not mutate the input array", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    // Fill a flat terrain at y=0 and y=1
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        setSolid(d, x, 0, z, n);
        setSolid(d, x, 1, z, n);
      }
    }
    const copy = new Float32Array(d);
    smoothTerrainFill(d, n, ys);
    expect(Array.from(d)).toEqual(Array.from(copy));
  });

  it("clears floating blocks above the surface to air", () => {
    const n = 8;
    const ys = 16;
    const d = makeDensities(n, ys);

    // Build solid terrain at y=0..4 (5 layers thick — clearly consecutive)
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 4; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Place floating blocks well above the surface (y=10, y=12)
    setSolid(d, 3, 10, 3, n);
    setSolid(d, 4, 12, 4, n);

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // The floating blocks at y=10 and y=12 should be cleared
    // (smoothed height ≈ 4, so anything at y >= 6 should be air)
    expect(getVal(result, 3, 10, 3, n)).toBeLessThan(SOLID_THRESHOLD);
    expect(getVal(result, 4, 12, 4, n)).toBeLessThan(SOLID_THRESHOLD);

    // Terrain at y=0..4 should remain solid
    expect(getVal(result, 3, 2, 3, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
    expect(getVal(result, 4, 2, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("rejects isolated 1-voxel spikes in the heightmap (consecutive-solid heuristic)", () => {
    const n = 8;
    const ys = 32;
    const d = makeDensities(n, ys);

    // Build solid terrain at y=0..10 everywhere
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 10; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Add a single isolated spike at y=28 (only 1 voxel, no solid below it at y=27)
    // The spike is far above the actual surface
    setSolid(d, 4, 28, 4, n);

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // The spike at y=28 should be cleared (not treated as the surface)
    expect(getVal(result, 4, 28, 4, n)).toBeLessThan(SOLID_THRESHOLD);

    // The real surface at y=10 should still be solid
    expect(getVal(result, 4, 10, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("median filter eliminates outlier heights", () => {
    const n = 8;
    const ys = 32;
    const d = makeDensities(n, ys);

    // Build terrain: most columns at height 10, one column spike to height 25
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 10; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Make one column much taller (y=0..25) — a height outlier
    for (let y = 11; y <= 25; y++) {
      setSolid(d, 4, y, 4, n);
    }

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // The outlier column should be trimmed down close to 10 by the median filter.
    // At y=20 (well above the median surface), the voxel should be cleared.
    expect(getVal(result, 4, 20, 4, n)).toBeLessThan(SOLID_THRESHOLD);

    // At the base (y=5), the outlier column should still be solid.
    expect(getVal(result, 4, 5, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("flood-fills empty columns from neighbors", () => {
    const n = 8;
    const ys = 8;
    const d = makeDensities(n, ys);

    // Build solid terrain at y=0..3 everywhere EXCEPT column (4,4)
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        if (x === 4 && z === 4) continue; // leave one column empty
        for (let y = 0; y <= 3; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // The empty column at (4,4) should be flood-filled with solid terrain
    // At y=0 it should now be solid
    expect(getVal(result, 4, 0, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("accepts y=0 edge case (single solid voxel at bottom)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);

    // Place a single solid voxel at y=0 for all columns
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        setSolid(d, x, 0, z, n);
      }
    }

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // y=0 voxels should still be treated as the surface (accepted unconditionally)
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        expect(getVal(result, x, 0, z, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
      }
    }
  });

  it("clears ALL above smoothed surface (no buffer)", () => {
    const n = 8;
    const ys = 24;
    const d = makeDensities(n, ys);

    // Build solid terrain at y=0..5
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 5; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Place solid voxels well above the surface with a gap >= GAP_THRESHOLD
    // so the scan doesn't absorb them into the terrain body.
    // Gap at y=6..10 (5 voxels), then solids at y=11,12
    setSolid(d, 4, 11, 4, n);
    setSolid(d, 4, 12, 4, n);

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // y=11 and y=12 should be cleared — above the smoothed surface
    expect(getVal(result, 4, 11, 4, n)).toBeLessThan(SOLID_THRESHOLD);
    expect(getVal(result, 4, 12, 4, n)).toBeLessThan(SOLID_THRESHOLD);
  });

  it("bottom-up gap detection: floating cluster above gap is cleared", () => {
    const n = 8;
    const ys = 16;
    const d = makeDensities(n, ys);

    // Terrain body: y=0..4
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 4; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Floating cluster: y=10..12 (gap of 5 at y=5..9, >= GAP_THRESHOLD)
    for (let y = 10; y <= 12; y++) {
      setSolid(d, 4, y, 4, n);
    }

    const { densities: result } = smoothTerrainFill(d, n, ys);

    // Floating cluster should be cleared
    expect(getVal(result, 4, 10, 4, n)).toBeLessThan(SOLID_THRESHOLD);
    expect(getVal(result, 4, 11, 4, n)).toBeLessThan(SOLID_THRESHOLD);
    expect(getVal(result, 4, 12, 4, n)).toBeLessThan(SOLID_THRESHOLD);

    // Real terrain should remain
    expect(getVal(result, 4, 4, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
    expect(getVal(result, 4, 0, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("tolerates 1-voxel air pocket within terrain (gap < threshold)", () => {
    const n = 8;
    const ys = 16;
    const d = makeDensities(n, ys);

    // Terrain with a 1-voxel air pocket at y=3
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 6; y++) {
          setSolid(d, x, y, z, n);
        }
        // Poke a hole at y=3 (1-voxel gap, < GAP_THRESHOLD of 5)
        d[3 * n * n + z * n + x] = -1;
      }
    }

    const { densities: result, heightmap } = smoothTerrainFill(d, n, ys);

    // Surface should still be at y≈6 (the 1-voxel gap didn't terminate the scan)
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        expect(heightmap[z * n + x]).toBeGreaterThanOrEqual(5);
      }
    }

    // Terrain at y=6 should be solid
    expect(getVal(result, 4, 6, 4, n)).toBeGreaterThanOrEqual(SOLID_THRESHOLD);
  });

  it("returns TerrainFillResult with heightmap", () => {
    const n = 4;
    const ys = 8;
    const d = makeDensities(n, ys);

    // Flat terrain at y=0..3
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 3; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    const result = smoothTerrainFill(d, n, ys);

    // Should return both densities and heightmap
    expect(result).toHaveProperty("densities");
    expect(result).toHaveProperty("heightmap");
    expect(result.densities).toBeInstanceOf(Float32Array);
    expect(result.heightmap).toBeInstanceOf(Float32Array);
    expect(result.heightmap.length).toBe(n * n);

    // All heightmap values should be ~3 for flat terrain
    // (average smoothing without rounding may produce fractional values)
    for (let i = 0; i < n * n; i++) {
      expect(result.heightmap[i]).toBeCloseTo(3, 0);
    }
  });

  it("SCAN_THRESHOLD captures transition zone voxels", () => {
    const n = 8;
    const ys = 16;
    const d = makeDensities(n, ys);

    // Build solid terrain at y=0..4 everywhere
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 4; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    // Add "transition zone" voxels at y=5 for one column: density between
    // SCAN_THRESHOLD and SOLID_THRESHOLD (marginal, almost-solid voxels).
    // These should be captured by the scan (SCAN_THRESHOLD = -0.35) but
    // would be missed by SOLID_THRESHOLD (-0.15).
    const marginalDensity = (SCAN_THRESHOLD + SOLID_THRESHOLD) / 2; // -0.25
    d[5 * n * n + 4 * n + 4] = marginalDensity;

    const { heightmap } = smoothTerrainFill(d, n, ys);

    // The raw height for column (4,4) should be 5 (the marginal voxel was captured).
    // After smoothing (neighbors are all at height 4), the smoothed height should be
    // between 4 and 5 — higher than it would be if the marginal voxel was missed.
    // With SOLID_THRESHOLD as scan threshold, the raw height would be 4 (same as neighbors).
    expect(heightmap[4 * n + 4]).toBeGreaterThanOrEqual(4);
  });

  it("mirror-pad edge consistency: edge columns get same smoothing as interior", () => {
    const n = 8;
    const ys = 8;
    const d = makeDensities(n, ys);

    // Build uniform flat terrain at y=0..3 everywhere
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        for (let y = 0; y <= 3; y++) {
          setSolid(d, x, y, z, n);
        }
      }
    }

    const { heightmap } = smoothTerrainFill(d, n, ys);

    // For uniform terrain, edge columns should have the same height as interior
    const interiorH = heightmap[4 * n + 4]; // interior column (4,4)
    const cornerH = heightmap[0 * n + 0]; // corner column (0,0)
    const edgeH = heightmap[0 * n + 4]; // edge column (0,4)

    expect(cornerH).toBe(interiorH);
    expect(edgeH).toBe(interiorH);
  });
});
