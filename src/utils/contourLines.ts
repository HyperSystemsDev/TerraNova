export interface ContourSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

export interface ContourLevel {
  level: number;
  segments: ContourSegment[];
}

export type ContourSet = ContourLevel[];

/**
 * Compute evenly-spaced contour levels between min and max.
 */
export function getContourLevels(min: number, max: number, interval: number): number[] {
  if (interval <= 0 || max <= min) return [];
  const levels: number[] = [];
  const start = Math.ceil(min / interval) * interval;
  for (let v = start; v < max; v += interval) {
    // Avoid floating-point drift
    const rounded = Math.round(v * 1e6) / 1e6;
    if (rounded > min && rounded < max) {
      levels.push(rounded);
    }
  }
  return levels;
}

// Marching-squares edge table.
// For each of the 16 cases (4-bit code), lists pairs of edges to connect.
// Edge indices: 0=top, 1=right, 2=bottom, 3=left
const EDGE_TABLE: number[][] = [
  [],         // 0000
  [3, 2],     // 0001
  [2, 1],     // 0010
  [3, 1],     // 0011
  [1, 0],     // 0100
  [3, 0, 1, 2], // 0101 (saddle)
  [2, 0],     // 0110
  [3, 0],     // 0111
  [0, 3],     // 1000
  [0, 2],     // 1001
  [0, 1, 2, 3], // 1010 (saddle)
  [0, 1],     // 1011
  [1, 3],     // 1100
  [1, 2],     // 1101
  [2, 3],     // 1110
  [],         // 1111
];

function interpolate(v1: number, v2: number, level: number): number {
  if (Math.abs(v2 - v1) < 1e-10) return 0.5;
  return (level - v1) / (v2 - v1);
}

/**
 * Generate contour line segments using marching squares.
 * Values are a flattened NxN grid (row-major). Returns segments in grid-cell coordinates (0..resolution-1).
 */
export function generateContours(
  values: Float32Array,
  resolution: number,
  levels: number[],
): ContourSet {
  const result: ContourSet = [];

  for (const level of levels) {
    const segments: ContourSegment[] = [];

    for (let row = 0; row < resolution - 1; row++) {
      for (let col = 0; col < resolution - 1; col++) {
        const tl = values[row * resolution + col];
        const tr = values[row * resolution + col + 1];
        const br = values[(row + 1) * resolution + col + 1];
        const bl = values[(row + 1) * resolution + col];

        // Compute 4-bit case: TL=8, TR=4, BR=2, BL=1
        const code =
          (tl >= level ? 8 : 0) |
          (tr >= level ? 4 : 0) |
          (br >= level ? 2 : 0) |
          (bl >= level ? 1 : 0);

        const edges = EDGE_TABLE[code];
        if (edges.length === 0) continue;

        // Compute interpolated positions on each edge
        const edgePoints: { x: number; z: number }[] = [];
        for (let e = 0; e < edges.length; e++) {
          const edge = edges[e];
          let x: number, z: number;
          switch (edge) {
            case 0: // top edge (TL → TR)
              x = col + interpolate(tl, tr, level);
              z = row;
              break;
            case 1: // right edge (TR → BR)
              x = col + 1;
              z = row + interpolate(tr, br, level);
              break;
            case 2: // bottom edge (BL → BR)
              x = col + interpolate(bl, br, level);
              z = row + 1;
              break;
            case 3: // left edge (TL → BL)
              x = col;
              z = row + interpolate(tl, bl, level);
              break;
            default:
              x = col;
              z = row;
          }
          edgePoints.push({ x, z });
        }

        // Connect pairs of edge points
        for (let i = 0; i < edgePoints.length; i += 2) {
          segments.push({
            x1: edgePoints[i].x,
            z1: edgePoints[i].z,
            x2: edgePoints[i + 1].x,
            z2: edgePoints[i + 1].z,
          });
        }
      }
    }

    result.push({ level, segments });
  }

  return result;
}
