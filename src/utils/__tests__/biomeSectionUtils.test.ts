import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import {
  getSectionSummary,
  getRootTypeChain,
  findRootNodes,
  getPropSummaries,
  extractMaterialLayers,
  findSpaceAndDepthNode,
  MATERIAL_COLORS,
} from "../biomeSectionUtils";
import type { BiomeConfig, BiomeSectionData } from "@/stores/editorStore";

/* ── Helpers ───────────────────────────────────────────────────────── */

function makeNode(id: string, type: string, fields: Record<string, unknown> = {}, extra: Record<string, unknown> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { type, fields, ...extra },
  };
}

function makeEdge(source: string, target: string, targetHandle?: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    targetHandle: targetHandle ?? null,
  };
}

/* ── findRootNodes ─────────────────────────────────────────────────── */

describe("findRootNodes", () => {
  it("returns nodes with no outgoing edges", () => {
    const nodes = [makeNode("a", "A"), makeNode("b", "B"), makeNode("c", "C")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    const roots = findRootNodes(nodes, edges);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe("c");
  });

  it("returns multiple roots when there are disconnected subtrees", () => {
    const nodes = [makeNode("a", "A"), makeNode("b", "B")];
    const edges: Edge[] = [];

    const roots = findRootNodes(nodes, edges);
    expect(roots).toHaveLength(2);
  });

  it("falls back to first node when all nodes have outgoing edges (cycle)", () => {
    const nodes = [makeNode("a", "A"), makeNode("b", "B")];
    const edges = [makeEdge("a", "b"), makeEdge("b", "a")];

    const roots = findRootNodes(nodes, edges);
    // Both nodes are sources so filter removes them all; fallback returns [nodes[0]]
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe("a");
  });

  it("returns empty array for empty input", () => {
    const roots = findRootNodes([], []);
    // Falls back to first element of empty slice = empty
    expect(roots).toHaveLength(0);
  });
});

/* ── getRootTypeChain ──────────────────────────────────────────────── */

describe("getRootTypeChain", () => {
  it("builds a type chain from root upstream", () => {
    const nodes = [
      makeNode("a", "SimplexNoise2D"),
      makeNode("b", "Clamp"),
      makeNode("c", "CacheOnce"),
    ];
    // a -> b -> c (c is root)
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    const chain = getRootTypeChain(nodes, edges);
    expect(chain).toBe("CacheOnce \u2192 Clamp \u2192 SimplexNoise2D");
  });

  it("respects maxDepth", () => {
    const nodes = [
      makeNode("a", "A"),
      makeNode("b", "B"),
      makeNode("c", "C"),
      makeNode("d", "D"),
    ];
    const edges = [makeEdge("a", "b"), makeEdge("b", "c"), makeEdge("c", "d")];

    const chain = getRootTypeChain(nodes, edges, 2);
    expect(chain).toBe("D \u2192 C");
  });

  it("handles single node", () => {
    const nodes = [makeNode("a", "Constant")];
    const chain = getRootTypeChain(nodes, []);
    expect(chain).toBe("Constant");
  });

  it("returns empty string for no nodes", () => {
    expect(getRootTypeChain([], [])).toBe("");
  });
});

/* ── getSectionSummary ─────────────────────────────────────────────── */

describe("getSectionSummary", () => {
  it("returns correct counts and label for Terrain", () => {
    const data: BiomeSectionData = {
      nodes: [makeNode("a", "A"), makeNode("b", "B")],
      edges: [makeEdge("a", "b")],
      history: [], historyIndex: -1,
    };
    const summary = getSectionSummary("Terrain", data);
    expect(summary.label).toBe("Terrain");
    expect(summary.nodeCount).toBe(2);
    expect(summary.edgeCount).toBe(1);
    expect(summary.color).toBe("#5B8DBF");
  });

  it("returns correct label for MaterialProvider", () => {
    const data: BiomeSectionData = { nodes: [], edges: [], history: [], historyIndex: -1 };
    const summary = getSectionSummary("MaterialProvider", data);
    expect(summary.label).toBe("Materials");
    expect(summary.color).toBe("#C87D3A");
  });

  it("returns correct label for Props sections", () => {
    const data: BiomeSectionData = { nodes: [], edges: [], history: [], historyIndex: -1 };
    const summary = getSectionSummary("Props[2]", data);
    expect(summary.label).toBe("Prop 2");
    expect(summary.color).toBe("#C76B6B");
  });
});

/* ── getPropSummaries ──────────────────────────────────────────────── */

describe("getPropSummaries", () => {
  it("extracts position and assignment types from prop sections", () => {
    const biomeConfig: BiomeConfig = {
      Name: "test",
      EnvironmentProvider: { Type: "Default" },
      TintProvider: { Type: "Gradient", From: "#000", To: "#fff" },
      propMeta: [{ Runtime: 0, Skip: false }],
    };
    const biomeSections: Record<string, BiomeSectionData> = {
      "Props[0]": {
        nodes: [
          makeNode("pos", "Mesh2D", { Resolution: 12, Jitter: 0.4 }, { _biomeField: "Positions" }),
          makeNode("asgn", "Constant", {}, { _biomeField: "Assignments" }),
        ],
        edges: [],
        history: [], historyIndex: -1,
      },
    };

    const summaries = getPropSummaries(biomeConfig, biomeSections);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].positionsType).toBe("Mesh2D");
    expect(summaries[0].positionsParams).toContain("Resolution=12");
    expect(summaries[0].assignmentsType).toBe("Constant");
    expect(summaries[0].runtime).toBe(0);
    expect(summaries[0].skip).toBe(false);
  });

  it("returns empty array when no prop sections exist", () => {
    const biomeConfig: BiomeConfig = {
      Name: "test",
      EnvironmentProvider: { Type: "Default" },
      TintProvider: { Type: "Gradient" },
      propMeta: [],
    };
    const summaries = getPropSummaries(biomeConfig, {});
    expect(summaries).toHaveLength(0);
  });
});

/* ── extractMaterialLayers (V1) ────────────────────────────────────── */

describe("extractMaterialLayers — V1", () => {
  it("extracts layers from a SpaceAndDepth graph (Solid/Empty)", () => {
    // SpaceAndDepth -> Solid(HeightGradient -> Low(stone), High(dirt)), Empty(grass)
    const nodes = [
      makeNode("root", "SpaceAndDepth", { DepthThreshold: 3 }),
      makeNode("hg", "HeightGradient", {}),
      makeNode("stone", "Constant", { Material: "stone" }),
      makeNode("dirt", "Constant", { Material: "dirt" }),
      makeNode("grass", "Constant", { Material: "grass" }),
    ];
    const edges = [
      makeEdge("hg", "root", "Solid"),
      makeEdge("grass", "root", "Empty"),
      makeEdge("stone", "hg", "Low"),
      makeEdge("dirt", "hg", "High"),
    ];

    const layers = extractMaterialLayers(nodes, edges);
    expect(layers.length).toBeGreaterThanOrEqual(3);

    const materialNames = layers.map((l) => l.material);
    expect(materialNames).toContain("stone");
    expect(materialNames).toContain("dirt");
    expect(materialNames).toContain("grass");
  });

  it("extracts layers from a Conditional graph", () => {
    const nodes = [
      makeNode("cond", "Conditional", { Threshold: 0.6 }),
      makeNode("noise", "SimplexNoise2D", {}),
      makeNode("gravel", "Constant", { Material: "gravel" }),
      makeNode("sand", "Constant", { Material: "sand" }),
    ];
    const edges = [
      makeEdge("noise", "cond", "Condition"),
      makeEdge("gravel", "cond", "TrueInput"),
      makeEdge("sand", "cond", "FalseInput"),
    ];

    const layers = extractMaterialLayers(nodes, edges);
    expect(layers).toHaveLength(2);
    expect(layers.map((l) => l.material)).toContain("gravel");
    expect(layers.map((l) => l.material)).toContain("sand");
  });

  it("handles single Constant node", () => {
    const nodes = [makeNode("c", "Constant", { Material: "stone" })];
    const layers = extractMaterialLayers(nodes, []);
    expect(layers).toHaveLength(1);
    expect(layers[0].material).toBe("stone");
  });

  it("returns empty for no nodes", () => {
    expect(extractMaterialLayers([], [])).toHaveLength(0);
  });
});

/* ── extractMaterialLayers (V2) ────────────────────────────────────── */

describe("extractMaterialLayers — V2", () => {
  it("extracts layers from Layers[] graph", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { LayerContext: "DEPTH_INTO_FLOOR", MaxExpectedDepth: 16 }),
      makeNode("layer0", "ConstantThickness", { Thickness: 3 }),
      makeNode("layer1", "RangeThickness", { RangeMin: 1, RangeMax: 5, Seed: "" }),
      makeNode("mat0", "Constant", { Material: "stone" }),
      makeNode("mat1", "Constant", { Material: "dirt" }),
    ];
    const edges = [
      makeEdge("layer0", "sad", "Layers[0]"),
      makeEdge("layer1", "sad", "Layers[1]"),
      makeEdge("mat0", "layer0", "Material"),
      makeEdge("mat1", "layer1", "Material"),
    ];

    const layers = extractMaterialLayers(nodes, edges);
    expect(layers).toHaveLength(2);

    expect(layers[0].material).toBe("stone");
    expect(layers[0].layerIndex).toBe(0);
    expect(layers[0].layerType).toBe("ConstantThickness");
    expect(layers[0].thickness).toBe(3);

    expect(layers[1].material).toBe("dirt");
    expect(layers[1].layerIndex).toBe(1);
    expect(layers[1].layerType).toBe("RangeThickness");
    expect(layers[1].thickness).toBe("1-5");
  });

  it("returns correct layer types", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { MaxExpectedDepth: 8 }),
      makeNode("layer0", "NoiseThickness", {}),
      makeNode("layer1", "WeightedThickness", { PossibleThicknesses: [{ Weight: 1, Thickness: 3 }], Seed: "" }),
      makeNode("mat0", "Constant", { Material: "sand" }),
      makeNode("mat1", "Constant", { Material: "gravel" }),
    ];
    const edges = [
      makeEdge("layer0", "sad", "Layers[0]"),
      makeEdge("layer1", "sad", "Layers[1]"),
      makeEdge("mat0", "layer0", "Material"),
      makeEdge("mat1", "layer1", "Material"),
    ];

    const layers = extractMaterialLayers(nodes, edges);
    expect(layers[0].layerType).toBe("NoiseThickness");
    expect(layers[0].thickness).toBe("noise");
    expect(layers[1].layerType).toBe("WeightedThickness");
    expect(layers[1].thickness).toBe("weighted");
  });

  it("V2 preferred when both Layers[] and Solid/Empty edges present", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { MaxExpectedDepth: 16 }),
      makeNode("layer0", "ConstantThickness", { Thickness: 2 }),
      makeNode("mat0", "Constant", { Material: "stone" }),
      makeNode("solidMat", "Constant", { Material: "grass" }),
    ];
    const edges = [
      makeEdge("layer0", "sad", "Layers[0]"),
      makeEdge("mat0", "layer0", "Material"),
      makeEdge("solidMat", "sad", "Solid"), // V1 edge also present
    ];

    const layers = extractMaterialLayers(nodes, edges);
    // Should use V2 (Layers[]) not V1 (Solid/Empty)
    expect(layers).toHaveLength(1);
    expect(layers[0].material).toBe("stone");
    expect(layers[0].layerIndex).toBe(0);
  });

  it("handles V2 layer with no material edge", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { MaxExpectedDepth: 8 }),
      makeNode("layer0", "ConstantThickness", { Thickness: 2 }),
    ];
    const edges = [
      makeEdge("layer0", "sad", "Layers[0]"),
    ];

    const layers = extractMaterialLayers(nodes, edges);
    expect(layers).toHaveLength(1);
    expect(layers[0].material).toBe("unknown");
    expect(layers[0].layerIndex).toBe(0);
  });
});

/* ── findSpaceAndDepthNode ─────────────────────────────────────────── */

describe("findSpaceAndDepthNode", () => {
  it("returns null when no SpaceAndDepth node exists", () => {
    const nodes = [makeNode("c", "Constant", { Material: "stone" })];
    expect(findSpaceAndDepthNode(nodes, [])).toBeNull();
  });

  it("returns V1 info when SpaceAndDepth has Solid/Empty edges", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { DepthThreshold: 3 }),
      makeNode("stone", "Constant", { Material: "stone" }),
    ];
    const edges = [makeEdge("stone", "sad", "Solid")];

    const result = findSpaceAndDepthNode(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.node.id).toBe("sad");
    expect(result!.isV2).toBe(false);
  });

  it("returns V2 info when SpaceAndDepth has Layers[] edges", () => {
    const nodes = [
      makeNode("sad", "SpaceAndDepth", { MaxExpectedDepth: 16 }),
      makeNode("layer0", "ConstantThickness", { Thickness: 3 }),
    ];
    const edges = [makeEdge("layer0", "sad", "Layers[0]")];

    const result = findSpaceAndDepthNode(nodes, edges);
    expect(result).not.toBeNull();
    expect(result!.node.id).toBe("sad");
    expect(result!.isV2).toBe(true);
  });
});

/* ── MATERIAL_COLORS ───────────────────────────────────────────────── */

describe("MATERIAL_COLORS", () => {
  it("has color entries for common materials", () => {
    expect(MATERIAL_COLORS.stone).toBeDefined();
    expect(MATERIAL_COLORS.dirt).toBeDefined();
    expect(MATERIAL_COLORS.grass).toBeDefined();
    expect(MATERIAL_COLORS.sand).toBeDefined();
  });
});
