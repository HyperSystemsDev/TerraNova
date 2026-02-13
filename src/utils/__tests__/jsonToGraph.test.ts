import { describe, it, expect } from "vitest";
import { jsonToGraph } from "../jsonToGraph";

describe("jsonToGraph", () => {
  it("produces 1 node from a simple asset", () => {
    const json = { Type: "SimplexNoise2D", Frequency: 0.01, Amplitude: 1 };
    const { nodes, edges } = jsonToGraph(json);

    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
    expect(nodes[0].type).toBe("SimplexNoise2D");
    expect((nodes[0].data as Record<string, unknown>).type).toBe("SimplexNoise2D");

    const fields = (nodes[0].data as Record<string, unknown>).fields as Record<string, unknown>;
    expect(fields.Frequency).toBe(0.01);
    expect(fields.Amplitude).toBe(1);
  });

  it("produces nodes + edges from nested assets", () => {
    const json = {
      Type: "Clamp",
      Min: 0,
      Max: 1,
      Input: {
        Type: "Constant",
        Value: 0.5,
      },
    };

    const { nodes, edges } = jsonToGraph(json);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    const clampNode = nodes.find((n) => (n.data as Record<string, unknown>).type === "Clamp");
    const constNode = nodes.find((n) => (n.data as Record<string, unknown>).type === "Constant");

    expect(clampNode).toBeDefined();
    expect(constNode).toBeDefined();

    const edge = edges[0];
    expect(edge.source).toBe(constNode!.id);
    expect(edge.target).toBe(clampNode!.id);
    expect(edge.targetHandle).toBe("Input");
    expect(edge.sourceHandle).toBe("output");
  });

  it("handles arrays of nested assets with indexed edges", () => {
    const json = {
      Type: "Sum",
      Inputs: [
        { Type: "Constant", Value: 1 },
        { Type: "Constant", Value: 2 },
      ],
    };

    const { nodes, edges } = jsonToGraph(json);

    // Sum node + 2 Constants
    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);

    // Check named target handles (Sum maps Inputs[0]→InputA, Inputs[1]→InputB)
    const handles = edges.map((e) => e.targetHandle).sort();
    expect(handles).toEqual(["InputA", "InputB"]);
  });

  it("applies category prefix mapping correctly", () => {
    const json = {
      Type: "CurveFunction",
      Curve: {
        Type: "Manual",
        Points: [],
      },
    };

    const { nodes } = jsonToGraph(json);
    const curveNode = nodes.find((n) => (n.data as Record<string, unknown>).type === "Manual");
    expect(curveNode).toBeDefined();
    // Should be prefixed with "Curve:" category
    expect(curveNode!.type).toBe("Curve:Manual");
  });

  it("handles SpaceAndDepth with Layers[] array", () => {
    const json = {
      Type: "SpaceAndDepth",
      LayerContext: "DEPTH_INTO_FLOOR",
      MaxExpectedDepth: 16,
      Layers: [
        {
          Type: "ConstantThickness",
          Thickness: 3,
          Material: { Type: "Constant", Material: "stone" },
        },
        {
          Type: "RangeThickness",
          RangeMin: 1,
          RangeMax: 5,
          Seed: "",
          Material: { Type: "Constant", Material: "dirt" },
        },
      ],
    };

    const { nodes, edges } = jsonToGraph(json);

    // SAD + 2 layers + 2 materials = 5 nodes
    expect(nodes).toHaveLength(5);

    // 2 layer→SAD edges + 2 material→layer edges = 4 edges
    expect(edges).toHaveLength(4);

    // Check Layers[] indexed handles
    const layerEdges = edges.filter((e) => /^Layers\[\d+\]$/.test(e.targetHandle ?? ""));
    expect(layerEdges).toHaveLength(2);
    expect(layerEdges.map((e) => e.targetHandle).sort()).toEqual(["Layers[0]", "Layers[1]"]);

    // Check Material edges on layer nodes
    const materialEdges = edges.filter((e) => e.targetHandle === "Material");
    expect(materialEdges).toHaveLength(2);

    // Check SAD node has V2 fields
    const sadNode = nodes.find((n) => (n.data as Record<string, unknown>).type === "SpaceAndDepth");
    expect(sadNode).toBeDefined();
    const fields = (sadNode!.data as Record<string, unknown>).fields as Record<string, unknown>;
    expect(fields.LayerContext).toBe("DEPTH_INTO_FLOOR");
    expect(fields.MaxExpectedDepth).toBe(16);

    // Layer nodes should have Material: prefix
    const layerNodes = nodes.filter((n) =>
      ["ConstantThickness", "RangeThickness"].includes((n.data as Record<string, unknown>).type as string),
    );
    expect(layerNodes).toHaveLength(2);
    expect(layerNodes[0].type).toMatch(/^Material:/);
  });

  it("maps CurveMapper Inputs[] to named 'Input' handle", () => {
    const json = {
      Type: "CurveMapper",
      Inputs: [{ Type: "BaseHeight" }],
    };

    const { edges } = jsonToGraph(json);

    expect(edges).toHaveLength(1);
    expect(edges[0].targetHandle).toBe("Input");
  });

  it("falls back to indexed handles for unknown types with Inputs[]", () => {
    const json = {
      Type: "UnknownFutureType",
      Inputs: [
        { Type: "Constant", Value: 1 },
        { Type: "Constant", Value: 2 },
      ],
    };

    const { edges } = jsonToGraph(json);

    expect(edges).toHaveLength(2);
    const handles = edges.map((e) => e.targetHandle).sort();
    expect(handles).toEqual(["Inputs[0]", "Inputs[1]"]);
  });

  it("preserves unknown fields in node.data.fields", () => {
    const json = {
      Type: "SimplexNoise2D",
      Frequency: 0.01,
      CustomField: "custom_value",
      SomeNumber: 42,
    };

    const { nodes } = jsonToGraph(json);
    const fields = (nodes[0].data as Record<string, unknown>).fields as Record<string, unknown>;
    expect(fields.Frequency).toBe(0.01);
    expect(fields.CustomField).toBe("custom_value");
    expect(fields.SomeNumber).toBe(42);
  });
});
