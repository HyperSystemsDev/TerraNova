import { getMaterialProperties } from "./materialResolver";

/**
 * Maps Hytale block names (from the server palette) to rendering colors.
 * Strips "hytale:" prefix and uses keyword matching for common block types.
 */

export interface BlockRenderInfo {
  name: string;
  color: string;
  roughness: number;
  metalness: number;
}

const BLOCK_COLORS: Record<string, string> = {
  // Core terrain
  air: "#00000000",
  stone: "#909090",
  grass: "#5cb85c",
  dirt: "#a0724a",
  sand: "#d4c590",
  gravel: "#a0a0a0",
  bedrock: "#2a2a2a",
  cobblestone: "#7a7a7a",
  clay: "#b87333",
  // Rock variants
  granite: "#9e8b7e",
  slate: "#5c5c6e",
  limestone: "#c4b99a",
  basalt: "#3d3d3d",
  sandstone: "#d2b48c",
  marble: "#e0ddd5",
  quartzite: "#d6cec0",
  // Soil variants
  mud: "#6b4423",
  moss: "#4a7a4a",
  // Snow / Ice
  snow: "#e8e8f0",
  ice: "#b0e0e6",
  packed_ice: "#9dcad4",
  // Wood / Organic
  wood: "#8b6b4a",
  log: "#8b6b4a",
  planks: "#c4a870",
  leaves: "#3e8a3e",
  cactus: "#5c9e3e",
  // Fluids
  water: "#4169e1",
  lava: "#ff4500",
  // Ores / Special
  coal_ore: "#3a3a3a",
  iron_ore: "#b8916e",
  gold_ore: "#ffd700",
  // Vegetation
  tall_grass: "#5cb85c",
  flower: "#d63384",
  mushroom: "#c0392b",
};

/** Keyword → color fallback for blocks not in the exact lookup */
const KEYWORD_COLORS: [string, string][] = [
  ["lava", "#ff4500"],
  ["magma", "#b22222"],
  ["water", "#4169e1"],
  ["ice", "#b0e0e6"],
  ["snow", "#e8e8f0"],
  ["stone", "#909090"],
  ["rock", "#909090"],
  ["granite", "#9e8b7e"],
  ["slate", "#5c5c6e"],
  ["basalt", "#3d3d3d"],
  ["limestone", "#c4b99a"],
  ["sandstone", "#d2b48c"],
  ["marble", "#e0ddd5"],
  ["grass", "#5cb85c"],
  ["dirt", "#a0724a"],
  ["soil", "#a0724a"],
  ["mud", "#6b4423"],
  ["clay", "#b87333"],
  ["sand", "#d4c590"],
  ["gravel", "#a0a0a0"],
  ["moss", "#4a7a4a"],
  ["wood", "#8b6b4a"],
  ["log", "#8b6b4a"],
  ["plank", "#c4a870"],
  ["leaves", "#3e8a3e"],
  ["leaf", "#3e8a3e"],
  ["bedrock", "#2a2a2a"],
  ["cobble", "#7a7a7a"],
  ["ore", "#908070"],
  ["crystal", "#88ccee"],
  ["glass", "#c0e8ff"],
];

/**
 * Resolve a block name from the server palette to a render color and PBR properties.
 * Strips "hytale:" prefix, normalizes to lowercase.
 */
export function resolveBlockColor(rawName: string): BlockRenderInfo {
  // Strip namespace prefix
  const name = rawName.replace(/^hytale:/, "").toLowerCase();

  // Exact match
  if (BLOCK_COLORS[name]) {
    const pbr = getMaterialProperties(name);
    return {
      name,
      color: BLOCK_COLORS[name],
      roughness: pbr.roughness ?? 0.8,
      metalness: pbr.metalness ?? 0.0,
    };
  }

  // Keyword match
  for (const [keyword, color] of KEYWORD_COLORS) {
    if (name.includes(keyword)) {
      const pbr = getMaterialProperties(keyword);
      return {
        name,
        color,
        roughness: pbr.roughness ?? 0.8,
        metalness: pbr.metalness ?? 0.0,
      };
    }
  }

  // Unknown block — gray
  return { name, color: "#808080", roughness: 0.8, metalness: 0.0 };
}
