export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
}

export interface Histogram {
  bins: number[];
  binEdges: number[];
}

/**
 * Compute descriptive statistics from a Float32Array of density values.
 */
export function computeStatistics(values: Float32Array): Statistics {
  const n = values.length;
  if (n === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, p25: 0, p75: 0 };
  }

  // Single pass for min, max, sum
  let min = values[0];
  let max = values[0];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / n;

  // StdDev (second pass)
  let variance = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    variance += d * d;
  }
  const stdDev = Math.sqrt(variance / n);

  // Sort a copy for percentiles
  const sorted = Float32Array.from(values).sort();
  const percentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  return {
    min,
    max,
    mean,
    median: percentile(50),
    stdDev,
    p25: percentile(25),
    p75: percentile(75),
  };
}

/**
 * Compute a histogram with the given number of bins.
 */
export function computeHistogram(values: Float32Array, binCount: number = 32): Histogram {
  const n = values.length;
  if (n === 0 || binCount <= 0) {
    return { bins: [], binEdges: [] };
  }

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < n; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  // Handle flat data
  if (max === min) {
    const bins = new Array(binCount).fill(0);
    bins[0] = n;
    const binEdges = [min];
    for (let i = 1; i <= binCount; i++) {
      binEdges.push(min + i * 0.001);
    }
    return { bins, binEdges };
  }

  const range = max - min;
  const binWidth = range / binCount;
  const bins = new Array(binCount).fill(0);
  const binEdges: number[] = [];
  for (let i = 0; i <= binCount; i++) {
    binEdges.push(min + i * binWidth);
  }

  for (let i = 0; i < n; i++) {
    let idx = Math.floor((values[i] - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1; // max value goes in last bin
    bins[idx]++;
  }

  return { bins, binEdges };
}
