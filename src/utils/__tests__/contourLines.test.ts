import { describe, it, expect } from "vitest";
import { generateContours, getContourLevels } from "../contourLines";

describe("getContourLevels", () => {
  it("generates evenly-spaced levels", () => {
    const levels = getContourLevels(0, 1, 0.25);
    expect(levels).toEqual([0.25, 0.5, 0.75]);
  });

  it("excludes exact min and max", () => {
    const levels = getContourLevels(0, 1, 0.5);
    expect(levels).toEqual([0.5]);
  });

  it("returns empty for zero interval", () => {
    expect(getContourLevels(0, 1, 0)).toEqual([]);
  });

  it("returns empty when max <= min", () => {
    expect(getContourLevels(1, 1, 0.1)).toEqual([]);
    expect(getContourLevels(2, 1, 0.1)).toEqual([]);
  });
});

describe("generateContours", () => {
  it("produces contour segments for a simple gradient", () => {
    // 4x4 grid with linear horizontal gradient 0..1
    const n = 4;
    const values = new Float32Array(n * n);
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        values[z * n + x] = x / (n - 1); // 0, 0.333, 0.666, 1
      }
    }

    const levels = [0.5];
    const contours = generateContours(values, n, levels);
    expect(contours).toHaveLength(1);
    expect(contours[0].level).toBe(0.5);
    expect(contours[0].segments.length).toBeGreaterThan(0);

    // All segments should cross approximately at x=1.5 (midpoint between col 1 and col 2)
    for (const seg of contours[0].segments) {
      // At least one endpoint should be near x ≈ 1.5
      const midX = (seg.x1 + seg.x2) / 2;
      expect(midX).toBeCloseTo(1.5, 0);
    }
  });

  it("produces zero contours for a flat field", () => {
    const n = 4;
    const values = new Float32Array(n * n).fill(0.5);
    const contours = generateContours(values, n, [0.25, 0.5, 0.75]);
    // Level 0.5: all corners are exactly equal to level → all are >=, so code=15 → no segments
    // Level 0.25: all corners >= 0.25 → code=15 → no segments
    // Level 0.75: all corners < 0.75 → code=0 → no segments
    for (const c of contours) {
      expect(c.segments).toHaveLength(0);
    }
  });

  it("handles a single cell crossing correctly", () => {
    // 2x2 grid: TL=0, TR=1, BL=0, BR=1
    const values = new Float32Array([0, 1, 0, 1]);
    const contours = generateContours(values, 2, [0.5]);
    expect(contours).toHaveLength(1);
    expect(contours[0].segments).toHaveLength(1);

    const seg = contours[0].segments[0];
    // Interpolation at level 0.5: top edge at x=0.5, bottom edge at x=0.5
    expect(seg.x1).toBeCloseTo(0.5, 1);
    expect(seg.x2).toBeCloseTo(0.5, 1);
  });

  it("handles all corners above level (no contour)", () => {
    const values = new Float32Array([1, 1, 1, 1]);
    const contours = generateContours(values, 2, [0.5]);
    expect(contours[0].segments).toHaveLength(0);
  });

  it("handles all corners below level (no contour)", () => {
    const values = new Float32Array([0, 0, 0, 0]);
    const contours = generateContours(values, 2, [0.5]);
    expect(contours[0].segments).toHaveLength(0);
  });

  it("generates multiple contour levels", () => {
    const n = 8;
    const values = new Float32Array(n * n);
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        values[z * n + x] = x / (n - 1);
      }
    }
    const levels = getContourLevels(0, 1, 0.25);
    const contours = generateContours(values, n, levels);
    expect(contours.length).toBe(3); // 0.25, 0.5, 0.75
    for (const c of contours) {
      expect(c.segments.length).toBeGreaterThan(0);
    }
  });
});
