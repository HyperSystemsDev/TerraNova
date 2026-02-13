import { describe, it, expect } from "vitest";
import { graphToJson, graphToJsonMulti } from "../graphToJson";
import { jsonToGraph } from "../jsonToGraph";

const MATERIAL_PROVIDER = {
  Type: "Conditional",
  Threshold: 0.6,
  Condition: {
    Type: "SimplexNoise2D",
    Frequency: 0.008,
    Amplitude: 1.0,
    Seed: 50,
    Octaves: 2,
    Lacunarity: 2.0,
    Gain: 0.5,
  },
  TrueInput: {
    Type: "Constant",
    Material: "gravel",
  },
  FalseInput: {
    Type: "SpaceAndDepth",
    DepthThreshold: 3,
    Solid: {
      Type: "HeightGradient",
      Range: { Min: 0, Max: 70 },
      Low: { Type: "Constant", Material: "stone" },
      High: { Type: "Constant", Material: "dirt" },
    },
    Empty: {
      Type: "Constant",
      Material: "grass",
    },
  },
};

const BIOME_WRAPPER = {
  Name: "forest_hills",
  Terrain: {
    Type: "DAOTerrain",
    Density: {
      Type: "Clamp",
      Min: -1,
      Max: 1,
      Input: {
        Type: "SimplexNoise2D",
        Frequency: 0.003,
        Amplitude: 1.0,
        Seed: 1,
      },
    },
  },
  MaterialProvider: MATERIAL_PROVIDER,
  Props: [
    {
      Runtime: 0,
      Skip: false,
      Positions: { Type: "Mesh2D", Resolution: 12, Jitter: 0.4 },
      Assignments: {
        Type: "Constant",
        Prop: { Type: "Prefab", Path: "props/trees/oak" },
      },
    },
  ],
  EnvironmentProvider: { Type: "Default" },
  TintProvider: { Type: "Gradient", From: "#2d5a1e", To: "#1a3a0e" },
};

describe("Biome detection", () => {
  it("identifies biome files (has Terrain, no Type)", () => {
    expect("Type" in BIOME_WRAPPER).toBe(false);
    expect("Terrain" in BIOME_WRAPPER).toBe(true);
  });

  it("rejects typed assets as biome files", () => {
    const noiseRange = { Type: "NoiseRange", Terrain: {} };
    expect("Type" in noiseRange).toBe(true);
  });

  it("rejects empty objects", () => {
    expect("Terrain" in {}).toBe(false);
  });
});

describe("MaterialProvider round-trip", () => {
  it("graphs and reconstructs MaterialProvider", () => {
    const { nodes, edges } = jsonToGraph(MATERIAL_PROVIDER);
    expect(nodes.length).toBeGreaterThan(1);
    expect(edges.length).toBeGreaterThan(0);

    const result = graphToJson(nodes, edges);
    expect(result).toEqual(MATERIAL_PROVIDER);
  });
});

describe("graphToJsonMulti with disconnected subtrees", () => {
  it("serializes two independent subtrees", () => {
    const tree1 = { Type: "Constant", Value: 1.0 };
    const tree2 = { Type: "Constant", Value: 2.0 };

    const { nodes: n1, edges: e1 } = jsonToGraph(tree1, 0, 0, "a");
    const { nodes: n2, edges: e2 } = jsonToGraph(tree2, 300, 0, "b");

    const allNodes = [...n1, ...n2];
    const allEdges = [...e1, ...e2];

    const results = graphToJsonMulti(allNodes, allEdges);
    expect(results).toHaveLength(2);
    expect(results).toContainEqual(tree1);
    expect(results).toContainEqual(tree2);
  });

  it("handles a single connected tree", () => {
    const tree = {
      Type: "Clamp",
      Min: 0,
      Max: 1,
      Input: { Type: "Constant", Value: 0.5 },
    };
    const { nodes, edges } = jsonToGraph(tree);
    const results = graphToJsonMulti(nodes, edges);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(tree);
  });
});

describe("idPrefix prevents ID collisions", () => {
  it("nodes from different prefixes have unique IDs", () => {
    const tree = { Type: "Constant", Value: 1.0 };

    const { nodes: n1 } = jsonToGraph(tree, 0, 0, "alpha");
    const { nodes: n2 } = jsonToGraph(tree, 0, 0, "beta");

    expect(n1[0].id).toMatch(/^alpha_/);
    expect(n2[0].id).toMatch(/^beta_/);
    expect(n1[0].id).not.toBe(n2[0].id);
  });

  it("default prefix is 'graph'", () => {
    const { nodes } = jsonToGraph({ Type: "Constant", Value: 0 });
    expect(nodes[0].id).toMatch(/^graph_/);
  });
});

describe("Biome section extraction", () => {
  it("Terrain Density subtree round-trips", () => {
    const density = BIOME_WRAPPER.Terrain.Density;
    const { nodes, edges } = jsonToGraph(density, 0, 0, "terrain");
    const result = graphToJson(nodes, edges);
    expect(result).toEqual(density);
  });

  it("Positions subtree round-trips", () => {
    const positions = BIOME_WRAPPER.Props[0].Positions;
    const { nodes, edges } = jsonToGraph(positions, 0, 0, "pos_0");
    const result = graphToJson(nodes, edges);
    expect(result).toEqual(positions);
  });

  it("Assignments subtree round-trips", () => {
    const assignments = BIOME_WRAPPER.Props[0].Assignments;
    const { nodes, edges } = jsonToGraph(assignments, 0, 0, "asgn_0");
    const result = graphToJson(nodes, edges);
    expect(result).toEqual(assignments);
  });
});
