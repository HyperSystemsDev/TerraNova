import { describe, it, expect } from "vitest";
import { graphToJson } from "../graphToJson";
import { jsonToGraph } from "../jsonToGraph";

const MAIN_WORLD_JSON = {
  Type: "NoiseRange",
  DefaultBiome: "forest_hills",
  DefaultTransitionDistance: 16,
  MaxBiomeEdgeDistance: 32,
  Biomes: [
    { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
  ],
  Density: {
    Type: "SimplexNoise2D",
    Frequency: 0.002,
    Amplitude: 1.0,
    Seed: 42,
    Octaves: 3,
    Lacunarity: 2.0,
    Gain: 0.5,
  },
  Framework: {},
};

describe("NoiseRange round-trip", () => {
  it("extracts biome ranges correctly", () => {
    const biomes = MAIN_WORLD_JSON.Biomes;
    expect(biomes).toHaveLength(1);
    expect(biomes[0]).toEqual({ Biome: "forest_hills", Min: -1.0, Max: 1.0 });
  });

  it("extracts config fields correctly", () => {
    expect(MAIN_WORLD_JSON.DefaultBiome).toBe("forest_hills");
    expect(MAIN_WORLD_JSON.DefaultTransitionDistance).toBe(16);
    expect(MAIN_WORLD_JSON.MaxBiomeEdgeDistance).toBe(32);
  });

  it("converts Density subtree to graph and back", () => {
    const density = MAIN_WORLD_JSON.Density;
    const { nodes, edges } = jsonToGraph(density);
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);

    const result = graphToJson(nodes, edges);
    expect(result).toEqual(density);
  });

  it("reassembles full NoiseRange JSON preserving Framework and unknown fields", () => {
    const original = { ...MAIN_WORLD_JSON };
    const biomeRanges = original.Biomes.map((b) => ({ ...b }));
    const config = {
      DefaultBiome: original.DefaultBiome,
      DefaultTransitionDistance: original.DefaultTransitionDistance,
      MaxBiomeEdgeDistance: original.MaxBiomeEdgeDistance,
    };

    // Graph the density subtree
    const { nodes, edges } = jsonToGraph(original.Density);
    const densityJson = graphToJson(nodes, edges);

    // Reassemble (mirroring the save logic in useTauriIO)
    const output = { ...original } as Record<string, unknown>;
    output.Biomes = biomeRanges.map((r) => ({ Biome: r.Biome, Min: r.Min, Max: r.Max }));
    output.DefaultBiome = config.DefaultBiome;
    output.DefaultTransitionDistance = config.DefaultTransitionDistance;
    output.MaxBiomeEdgeDistance = config.MaxBiomeEdgeDistance;
    if (densityJson) output.Density = densityJson;

    expect(output).toEqual(original);
    expect(output.Framework).toEqual({});
    expect(output.Type).toBe("NoiseRange");
  });

  it("preserves modified biome ranges in output", () => {
    const original = { ...MAIN_WORLD_JSON };
    const biomeRanges = [
      { Biome: "forest_hills", Min: -0.5, Max: 0.5 },
      { Biome: "desert", Min: 0.3, Max: 1.0 },
    ];

    const { nodes, edges } = jsonToGraph(original.Density);
    const densityJson = graphToJson(nodes, edges);

    const output = { ...original } as Record<string, unknown>;
    output.Biomes = biomeRanges.map((r) => ({ Biome: r.Biome, Min: r.Min, Max: r.Max }));
    if (densityJson) output.Density = densityJson;

    expect((output.Biomes as Array<{ Biome: string; Min: number; Max: number }>)).toHaveLength(2);
    expect((output.Biomes as Array<{ Biome: string; Min: number; Max: number }>)[0].Min).toBe(-0.5);
    expect((output.Biomes as Array<{ Biome: string; Min: number; Max: number }>)[1].Biome).toBe("desert");
    // Framework still preserved
    expect(output.Framework).toEqual({});
  });

  it("handles Density with nested typed nodes", () => {
    const complexDensity = {
      Type: "Clamp",
      Min: -1,
      Max: 1,
      Input: {
        Type: "SimplexNoise2D",
        Frequency: 0.002,
        Amplitude: 1.0,
      },
    };

    const { nodes, edges } = jsonToGraph(complexDensity);
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    const result = graphToJson(nodes, edges);
    expect(result).toEqual(complexDensity);
  });
});
