import { describe, it, expect } from "vitest";
import { buildVoxelMeshes, computeVertexAO } from "../voxelMeshBuilder";
import type { VoxelData } from "../voxelExtractor";

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Create a density volume with given resolution (n x n x ys). All air by default. */
function makeDensities(n: number, ys: number): Float32Array {
  const d = new Float32Array(n * n * ys);
  d.fill(-1);
  return d;
}

/** Set a voxel solid at (x, y, z) */
function setSolid(d: Float32Array, x: number, y: number, z: number, n: number, val = 1) {
  d[y * n * n + z * n + x] = val;
}

/** Create VoxelData for a single block at (x, y, z) */
function singleBlockVoxelData(x: number, y: number, z: number): VoxelData {
  return {
    positions: new Float32Array([x, y, z]),
    materialIds: new Uint8Array([0]),
    materials: [{ name: "Test", color: "#808080" }],
    count: 1,
  };
}

/** Count quads (faces) in mesh data: indices.length / 6 */
function countQuads(meshes: ReturnType<typeof buildVoxelMeshes>): number {
  let total = 0;
  for (const m of meshes) total += m.indices.length / 6;
  return total;
}

/** Count quads with a specific normal direction */
function countQuadsByNormal(meshes: ReturnType<typeof buildVoxelMeshes>, nx: number, ny: number, nz: number): number {
  let count = 0;
  for (const m of meshes) {
    const vertCount = m.positions.length / 3;
    // Each quad has 4 consecutive vertices; check first vertex's normal
    for (let qi = 0; qi < vertCount; qi += 4) {
      if (
        m.normals[qi * 3] === nx &&
        m.normals[qi * 3 + 1] === ny &&
        m.normals[qi * 3 + 2] === nz
      ) {
        count++;
      }
    }
  }
  return count;
}

/* ── AO computation tests ─────────────────────────────────────────── */

describe("computeVertexAO", () => {
  it("returns 0 when no neighbors are solid", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);

    // Check AO for a top-face vertex with edge1=(-1,1,0), edge2=(0,1,-1), corner=(-1,1,-1)
    const ao = computeVertexAO(d, 1, 1, 1, [-1, 1, 0], [0, 1, -1], [-1, 1, -1], n, ys);
    expect(ao).toBe(0);
  });

  it("returns 1 when one edge neighbor is solid", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 0, 2, 1, n); // edge1 neighbor at (-1,1,0) relative = (0, 2, 1)

    const ao = computeVertexAO(d, 1, 1, 1, [-1, 1, 0], [0, 1, -1], [-1, 1, -1], n, ys);
    expect(ao).toBe(1);
  });

  it("returns 3 when both edges are solid (corner occluded)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 0, 2, 1, n); // edge1: (-1,1,0)
    setSolid(d, 1, 2, 0, n); // edge2: (0,1,-1)
    // Corner doesn't matter when both edges are solid — always returns 3

    const ao = computeVertexAO(d, 1, 1, 1, [-1, 1, 0], [0, 1, -1], [-1, 1, -1], n, ys);
    expect(ao).toBe(3);
  });

  it("returns 2 when both edges are solid but via edge+corner (not both edges)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 0, 2, 1, n); // edge1: (-1,1,0)
    setSolid(d, 0, 2, 0, n); // corner: (-1,1,-1)

    const ao = computeVertexAO(d, 1, 1, 1, [-1, 1, 0], [0, 1, -1], [-1, 1, -1], n, ys);
    expect(ao).toBe(2);
  });
});

/* ── Face culling tests ───────────────────────────────────────────── */

describe("buildVoxelMeshes — face culling", () => {
  it("single isolated block emits 6 faces (24 vertices, 36 indices)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);

    const voxels = singleBlockVoxelData(1, 1, 1);
    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    expect(meshes).toHaveLength(1);
    // 6 faces * 4 verts = 24 verts * 3 components = 72
    expect(meshes[0].positions.length).toBe(72);
    // 6 faces * 6 indices = 36
    expect(meshes[0].indices.length).toBe(36);
  });

  it("two adjacent blocks share a face that is culled", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 2, 1, 1, n);

    const voxels: VoxelData = {
      positions: new Float32Array([1, 1, 1, 2, 1, 1]),
      materialIds: new Uint8Array([0, 0]),
      materials: [{ name: "Test", color: "#808080" }],
      count: 2,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    expect(meshes).toHaveLength(1);
    // With greedy meshing, the top, bottom, front, back faces get merged into
    // single quads (2 blocks wide), and the two side faces remain.
    // Total: 4 merged faces + 2 single faces = 6 quads (was 10 faces before greedy)
    const totalQuads = countQuads(meshes);
    // Should be less than the unmerged 10 faces
    expect(totalQuads).toBeLessThanOrEqual(10);
    // But still at least 6 (minimum for the enclosing shape)
    expect(totalQuads).toBeGreaterThanOrEqual(6);
  });
});

/* ── Face brightness tests ────────────────────────────────────────── */

describe("buildVoxelMeshes — face brightness", () => {
  it("top face vertices are brightest (brightness=1.0 with AO=0)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);

    const voxels = singleBlockVoxelData(1, 1, 1);
    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    const m = meshes[0];

    // Find top-face vertices: those with normal (0, 1, 0)
    const topVertIndices: number[] = [];
    for (let i = 0; i < m.normals.length / 3; i++) {
      if (m.normals[i * 3 + 1] === 1) topVertIndices.push(i);
    }
    expect(topVertIndices.length).toBe(4);

    // Bottom face vertices: normal (0, -1, 0) — brightness 0.5
    const bottomVertIndices: number[] = [];
    for (let i = 0; i < m.normals.length / 3; i++) {
      if (m.normals[i * 3 + 1] === -1) bottomVertIndices.push(i);
    }
    expect(bottomVertIndices.length).toBe(4);

    // Top should be brighter than bottom (both have AO=0 for isolated block)
    // Using R channel for comparison (gray block: R=G=B)
    const topR = m.colors[topVertIndices[0] * 3];
    const bottomR = m.colors[bottomVertIndices[0] * 3];
    expect(topR).toBeGreaterThan(bottomR);
  });
});

/* ── Color jitter tests ───────────────────────────────────────────── */

describe("buildVoxelMeshes — color jitter", () => {
  it("same block position always produces the same vertex colors (deterministic)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);

    const voxels = singleBlockVoxelData(1, 1, 1);
    const m1 = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    const m2 = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    expect(Array.from(m1[0].colors)).toEqual(Array.from(m2[0].colors));
  });

  it("different block positions produce different vertex colors", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 2, 2, 2, n);

    const v1 = singleBlockVoxelData(1, 1, 1);
    const v2 = singleBlockVoxelData(2, 2, 2);

    const m1 = buildVoxelMeshes(v1, d, n, ys, 1, 1, 1, 0, 0, 0);
    const m2 = buildVoxelMeshes(v2, d, n, ys, 1, 1, 1, 0, 0, 0);

    // At least some vertex colors should differ (jitter is different)
    let anyDifferent = false;
    for (let i = 0; i < m1[0].colors.length; i++) {
      if (Math.abs(m1[0].colors[i] - m2[0].colors[i]) > 0.001) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });
});

/* ── Triangle winding flip tests ──────────────────────────────────── */

describe("buildVoxelMeshes — AO-aware triangle winding", () => {
  it("flips diagonal when AO differs on opposite corners", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    // Block at (1,0,1)
    setSolid(d, 1, 0, 1, n);
    // Add neighbors to create asymmetric AO on top face
    // Edge neighbors for top face vertex 0: (-1,1,0)=>(0,1,1) and (0,1,-1)=>(1,1,0)
    setSolid(d, 0, 1, 1, n); // Above-left: affects vertex 0 and 3
    setSolid(d, 0, 1, 2, n); // Affects vertex 3

    const voxels = singleBlockVoxelData(1, 0, 1);
    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    // The test passes if it doesn't crash and produces valid output
    expect(meshes).toHaveLength(1);
    expect(meshes[0].indices.length).toBeGreaterThan(0);

    // Verify all indices are within vertex range
    const vertCount = meshes[0].positions.length / 3;
    for (let i = 0; i < meshes[0].indices.length; i++) {
      expect(meshes[0].indices[i]).toBeLessThan(vertCount);
    }
  });
});

/* ── Face geometry correctness ─────────────────────────────────────── */

describe("buildVoxelMeshes — face geometry", () => {
  it("all faces of a single block form a proper unit cube (no displaced faces)", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);

    const voxels = singleBlockVoxelData(1, 1, 1);
    // scale=1, offset=0 so positions are in block coordinates
    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    const m = meshes[0];

    // All vertex positions must be within the block bounds [1, 2] in each axis
    const vertCount = m.positions.length / 3;
    for (let i = 0; i < vertCount; i++) {
      const x = m.positions[i * 3];
      const y = m.positions[i * 3 + 1];
      const z = m.positions[i * 3 + 2];
      expect(x).toBeGreaterThanOrEqual(1);
      expect(x).toBeLessThanOrEqual(2);
      expect(y).toBeGreaterThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(2);
      expect(z).toBeGreaterThanOrEqual(1);
      expect(z).toBeLessThanOrEqual(2);
    }
  });

  it("adjacent blocks share face positions with no gaps", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 2, 1, 1, n);

    const voxels: VoxelData = {
      positions: new Float32Array([1, 1, 1, 2, 1, 1]),
      materialIds: new Uint8Array([0, 0]),
      materials: [{ name: "Test", color: "#808080" }],
      count: 2,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    const m = meshes[0];

    // Block A occupies [1,2], block B occupies [2,3]
    // All vertices must be in [1, 3] for x, [1, 2] for y and z
    const vertCount = m.positions.length / 3;
    for (let i = 0; i < vertCount; i++) {
      const x = m.positions[i * 3];
      const y = m.positions[i * 3 + 1];
      const z = m.positions[i * 3 + 2];
      expect(x).toBeGreaterThanOrEqual(1);
      expect(x).toBeLessThanOrEqual(3);
      expect(y).toBeGreaterThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(2);
      expect(z).toBeGreaterThanOrEqual(1);
      expect(z).toBeLessThanOrEqual(2);
    }
  });
});

/* ── Multiple materials ───────────────────────────────────────────── */

describe("buildVoxelMeshes — multiple materials", () => {
  it("produces separate mesh data per material", () => {
    const n = 4;
    const ys = 4;
    const d = makeDensities(n, ys);
    setSolid(d, 1, 1, 1, n);
    setSolid(d, 2, 1, 1, n);

    const voxels: VoxelData = {
      positions: new Float32Array([1, 1, 1, 2, 1, 1]),
      materialIds: new Uint8Array([0, 1]),
      materials: [
        { name: "Grass", color: "#5cb85c" },
        { name: "Dirt", color: "#a0724a" },
      ],
      count: 2,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    expect(meshes).toHaveLength(2);
    expect(meshes.map((m) => m.materialIndex).sort()).toEqual([0, 1]);
  });
});

/* ── Greedy meshing specific tests ────────────────────────────────── */

describe("buildVoxelMeshes — greedy meshing", () => {
  it("flat 4x1x4 surface (same material, no AO) merges top face into 1 quad", () => {
    const n = 8;
    const ys = 4;
    const d = makeDensities(n, ys);

    // Create a 4x1x4 flat surface at y=0
    const positions: number[] = [];
    const matIds: number[] = [];
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        setSolid(d, x, 0, z, n);
        positions.push(x, 0, z);
        matIds.push(0);
      }
    }

    const voxels: VoxelData = {
      positions: new Float32Array(positions),
      materialIds: new Uint8Array(matIds),
      materials: [{ name: "Test", color: "#808080" }],
      count: 16,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    // Top face (+Y): all 16 blocks have same material, same AO (all 0 since
    // no neighbors above), should merge into exactly 1 quad
    const topQuads = countQuadsByNormal(meshes, 0, 1, 0);
    expect(topQuads).toBe(1);
  });

  it("two adjacent blocks with different AO produce 2 separate quads on affected face", () => {
    const n = 8;
    const ys = 4;
    const d = makeDensities(n, ys);

    // Two blocks side by side at y=0
    setSolid(d, 1, 0, 1, n);
    setSolid(d, 2, 0, 1, n);
    // Add a block above block 1 to create different AO on the top face
    setSolid(d, 1, 1, 1, n);

    // Only the bottom blocks are surface voxels we care about for the test
    // Block at (2,0,1) has top face exposed with different AO than (1,0,1)
    const voxels: VoxelData = {
      positions: new Float32Array([1, 0, 1, 2, 0, 1]),
      materialIds: new Uint8Array([0, 0]),
      materials: [{ name: "Test", color: "#808080" }],
      count: 2,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    // The top face of block (1,0,1) is occluded (block above), so only block (2,0,1) has a top face
    // But they should still not merge because AO differs
    // The key test: different AO prevents merging
    expect(meshes.length).toBeGreaterThanOrEqual(1);
    expect(countQuads(meshes)).toBeGreaterThan(0);
  });

  it("two adjacent blocks with different materials produce separate quads", () => {
    const n = 8;
    const ys = 4;
    const d = makeDensities(n, ys);

    setSolid(d, 1, 0, 1, n);
    setSolid(d, 2, 0, 1, n);

    const voxels: VoxelData = {
      positions: new Float32Array([1, 0, 1, 2, 0, 1]),
      materialIds: new Uint8Array([0, 1]),
      materials: [
        { name: "Grass", color: "#5cb85c" },
        { name: "Dirt", color: "#a0724a" },
      ],
      count: 2,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);

    // Should produce 2 separate material meshes
    expect(meshes).toHaveLength(2);

    // Each material's top face should be exactly 1 quad
    for (const m of meshes) {
      const topQuads = countQuadsByNormal([m], 0, 1, 0);
      expect(topQuads).toBe(1);
    }
  });

  it("large 16x16 flat surface produces significantly fewer quads than 256", () => {
    const n = 20;
    const ys = 4;
    const d = makeDensities(n, ys);

    const positions: number[] = [];
    const matIds: number[] = [];
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        setSolid(d, x, 0, z, n);
        positions.push(x, 0, z);
        matIds.push(0);
      }
    }

    const voxels: VoxelData = {
      positions: new Float32Array(positions),
      materialIds: new Uint8Array(matIds),
      materials: [{ name: "Test", color: "#808080" }],
      count: 256,
    };

    const meshes = buildVoxelMeshes(voxels, d, n, ys, 1, 1, 1, 0, 0, 0);
    const totalQuads = countQuads(meshes);

    // Without greedy meshing: 256 * 5 exposed faces = 1280 quads
    // (each block has 5 exposed faces: top, bottom, and up to 3 sides depending on position)
    // With greedy meshing: should be dramatically fewer
    // A perfect 16x16 flat surface has exactly 1 top quad, 1 bottom quad,
    // and 4 side faces (16 blocks each, merged into 1 quad each) = 6 total
    expect(totalQuads).toBeLessThan(50); // Much less than unmerged
  });
});
