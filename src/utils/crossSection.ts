export interface CrossSectionSample {
  distance: number;
  x: number;
  z: number;
  value: number;
}

/**
 * Bilinear interpolation on a flattened NxN grid.
 * gridX and gridZ are in grid-cell coordinates (0..resolution-1).
 */
export function bilinearSample(
  values: Float32Array,
  resolution: number,
  gridX: number,
  gridZ: number,
): number {
  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, resolution - 1);
  const z1 = Math.min(z0 + 1, resolution - 1);
  const fx = gridX - x0;
  const fz = gridZ - z0;

  const cx0 = Math.max(0, Math.min(resolution - 1, x0));
  const cz0 = Math.max(0, Math.min(resolution - 1, z0));

  const v00 = values[cz0 * resolution + cx0];
  const v10 = values[cz0 * resolution + x1];
  const v01 = values[z1 * resolution + cx0];
  const v11 = values[z1 * resolution + x1];

  return (
    v00 * (1 - fx) * (1 - fz) +
    v10 * fx * (1 - fz) +
    v01 * (1 - fx) * fz +
    v11 * fx * fz
  );
}

/**
 * Sample density values along a line from start to end in world coordinates.
 * Returns equidistant samples with bilinear interpolation.
 */
export function sampleCrossSection(
  values: Float32Array,
  resolution: number,
  rangeMin: number,
  rangeMax: number,
  start: { x: number; z: number },
  end: { x: number; z: number },
): CrossSectionSample[] {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const worldLength = Math.sqrt(dx * dx + dz * dz);
  if (worldLength < 1e-6) return [];

  // Oversample at 2x grid resolution
  const sampleCount = Math.max(2, Math.ceil(resolution * 2 * worldLength / (rangeMax - rangeMin)));
  const range = rangeMax - rangeMin;
  const samples: CrossSectionSample[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const wx = start.x + t * dx;
    const wz = start.z + t * dz;

    // World → grid coordinates
    const gridX = ((wx - rangeMin) / range) * (resolution - 1);
    const gridZ = ((wz - rangeMin) / range) * (resolution - 1);

    const value = bilinearSample(values, resolution, gridX, gridZ);
    samples.push({
      distance: t * worldLength,
      x: wx,
      z: wz,
      value,
    });
  }

  return samples;
}
