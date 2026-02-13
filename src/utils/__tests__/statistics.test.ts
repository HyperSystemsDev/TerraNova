import { describe, it, expect } from "vitest";
import { computeStatistics, computeHistogram } from "../statistics";

describe("computeStatistics", () => {
  it("computes correct stats for a known distribution", () => {
    // Values 1-10
    const values = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const stats = computeStatistics(values);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(10);
    expect(stats.mean).toBeCloseTo(5.5, 5);
    expect(stats.median).toBeCloseTo(5.5, 5);
    expect(stats.p25).toBeCloseTo(3.25, 1);
    expect(stats.p75).toBeCloseTo(7.75, 1);
    expect(stats.stdDev).toBeGreaterThan(0);
  });

  it("handles empty array", () => {
    const stats = computeStatistics(new Float32Array(0));
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.stdDev).toBe(0);
  });

  it("handles single value", () => {
    const stats = computeStatistics(new Float32Array([42]));
    expect(stats.min).toBe(42);
    expect(stats.max).toBe(42);
    expect(stats.mean).toBe(42);
    expect(stats.median).toBe(42);
    expect(stats.stdDev).toBe(0);
    expect(stats.p25).toBe(42);
    expect(stats.p75).toBe(42);
  });

  it("handles all same values", () => {
    const values = new Float32Array(100).fill(3.14);
    const stats = computeStatistics(values);
    expect(stats.min).toBeCloseTo(3.14, 2);
    expect(stats.max).toBeCloseTo(3.14, 2);
    expect(stats.mean).toBeCloseTo(3.14, 2);
    expect(stats.stdDev).toBeCloseTo(0, 5);
  });
});

describe("computeHistogram", () => {
  it("distributes values into correct bins", () => {
    const values = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
    const hist = computeHistogram(values, 4);
    expect(hist.bins).toHaveLength(4);
    expect(hist.binEdges).toHaveLength(5);
    // Total count should equal number of values
    const total = hist.bins.reduce((a, b) => a + b, 0);
    expect(total).toBe(5);
  });

  it("handles empty input", () => {
    const hist = computeHistogram(new Float32Array(0), 10);
    expect(hist.bins).toHaveLength(0);
    expect(hist.binEdges).toHaveLength(0);
  });

  it("handles all same values (flat data)", () => {
    const values = new Float32Array(10).fill(5);
    const hist = computeHistogram(values, 4);
    expect(hist.bins).toHaveLength(4);
    // All values in first bin
    expect(hist.bins[0]).toBe(10);
  });

  it("bin edges span the full range", () => {
    const values = new Float32Array([0, 1, 2, 3, 4, 5]);
    const hist = computeHistogram(values, 5);
    expect(hist.binEdges[0]).toBe(0);
    expect(hist.binEdges[hist.binEdges.length - 1]).toBe(5);
  });
});
