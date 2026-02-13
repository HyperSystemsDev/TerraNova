import { describe, it, expect } from "vitest";
import { bilinearSample, sampleCrossSection } from "../crossSection";

describe("bilinearSample", () => {
  it("returns exact values at grid corners", () => {
    // 3x3 grid
    const values = new Float32Array([
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
    ]);
    expect(bilinearSample(values, 3, 0, 0)).toBe(0);
    expect(bilinearSample(values, 3, 1, 0)).toBe(1);
    expect(bilinearSample(values, 3, 2, 2)).toBe(8);
  });

  it("interpolates correctly at midpoints", () => {
    // 2x2 grid: 0, 1, 0, 1
    const values = new Float32Array([0, 1, 0, 1]);
    expect(bilinearSample(values, 2, 0.5, 0)).toBeCloseTo(0.5, 5);
    expect(bilinearSample(values, 2, 0.5, 0.5)).toBeCloseTo(0.5, 5);
  });

  it("clamps at grid boundaries", () => {
    const values = new Float32Array([1, 2, 3, 4]);
    // Should not crash with negative or out-of-bounds coords
    const v = bilinearSample(values, 2, -0.5, -0.5);
    expect(typeof v).toBe("number");
    expect(isNaN(v)).toBe(false);
  });
});

describe("sampleCrossSection", () => {
  it("samples a linear gradient correctly", () => {
    // 4x4 grid with horizontal gradient
    const n = 4;
    const values = new Float32Array(n * n);
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        values[z * n + x] = x / (n - 1);
      }
    }

    // Horizontal line across the middle
    const samples = sampleCrossSection(values, n, 0, 4, { x: 0, z: 2 }, { x: 4, z: 2 });
    expect(samples.length).toBeGreaterThan(0);

    // First sample should be near 0, last near 1
    expect(samples[0].value).toBeCloseTo(0, 0);
    expect(samples[samples.length - 1].value).toBeCloseTo(1, 0);

    // Values should be monotonically increasing
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].value).toBeGreaterThanOrEqual(samples[i - 1].value - 0.01);
    }

    // Distance should be monotonically increasing
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].distance).toBeGreaterThan(samples[i - 1].distance);
    }
  });

  it("returns empty for zero-length line", () => {
    const values = new Float32Array([1, 2, 3, 4]);
    const samples = sampleCrossSection(values, 2, 0, 2, { x: 1, z: 1 }, { x: 1, z: 1 });
    expect(samples).toHaveLength(0);
  });

  it("produces correct distances", () => {
    const n = 4;
    const values = new Float32Array(n * n).fill(0.5);
    const start = { x: 0, z: 0 };
    const end = { x: 3, z: 4 };
    const samples = sampleCrossSection(values, n, -4, 4, start, end);

    // Total distance should be 5 (3-4-5 triangle)
    const lastDist = samples[samples.length - 1].distance;
    expect(lastDist).toBeCloseTo(5, 1);
  });
});
