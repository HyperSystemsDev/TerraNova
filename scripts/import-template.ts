/**
 * CLI script to import a Hytale-native template into TerraNova internal format.
 * Usage: npx tsx scripts/import-template.ts <input-path> <template-name> [options]
 *
 * <input-path>  — Directory with HytaleGenerator/ subtree, or a single .json biome file
 * <template-name> — Target slug (output dir under templates/)
 * --name "Display Name"       — Manifest display name (default: derived from slug)
 * --category Fantasy|Nature|Starter — Manifest category (default: Fantasy)
 * --description "..."         — Manifest description
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { hytaleToInternalBiome, hytaleToInternal, isHytaleNativeFormat } from "../src/utils/hytaleToInternal.js";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags: Record<string, string> = {};
const positional: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--") && i + 1 < args.length) {
    flags[args[i].slice(2)] = args[++i];
  } else {
    positional.push(args[i]);
  }
}

const inputPath = positional[0];
const templateName = positional[1];

if (!inputPath || !templateName) {
  console.error("Usage: npx tsx scripts/import-template.ts <input-path> <template-name> [--name \"Display Name\"] [--category Fantasy] [--description \"...\"]");
  process.exit(1);
}

if (!existsSync(inputPath)) {
  console.error(`Input path not found: ${inputPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Detect input type
// ---------------------------------------------------------------------------

const inputStat = statSync(inputPath);
const isSingleFile = inputStat.isFile() && extname(inputPath).toLowerCase() === ".json";

// Resolve HytaleGenerator root for directory mode
let hytaleGenRoot: string | null = null;
if (!isSingleFile) {
  const candidate = join(inputPath, "HytaleGenerator");
  if (existsSync(candidate)) {
    hytaleGenRoot = candidate;
  } else if (basename(inputPath) === "HytaleGenerator") {
    hytaleGenRoot = inputPath;
  } else {
    // Check if the directory itself contains Biomes/ directly (bare HytaleGenerator contents)
    const biomesCandidate = join(inputPath, "Biomes");
    if (existsSync(biomesCandidate)) {
      hytaleGenRoot = inputPath;
    } else {
      console.error(`Could not find HytaleGenerator/ subtree in: ${inputPath}`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Discover input files
// ---------------------------------------------------------------------------

let settingsJson: string | null = null;
let worldStructureJson: Record<string, unknown> | null = null;
const biomeFiles: { name: string; data: Record<string, unknown> }[] = [];

if (isSingleFile) {
  // Single biome file mode
  const data = JSON.parse(readFileSync(inputPath, "utf8"));
  const name = basename(inputPath, ".json");
  biomeFiles.push({ name, data });
  console.log(`Single-file mode: ${basename(inputPath)}`);
} else {
  // Directory mode — discover Settings, WorldStructures, Biomes
  const settingsPath = join(hytaleGenRoot!, "Settings", "Settings.json");
  if (existsSync(settingsPath)) {
    settingsJson = readFileSync(settingsPath, "utf8");
    console.log("  Found Settings.json");
  }

  const worldStructuresDir = join(hytaleGenRoot!, "WorldStructures");
  if (existsSync(worldStructuresDir)) {
    const wsFiles = readdirSync(worldStructuresDir).filter((f: string) => f.endsWith(".json"));
    if (wsFiles.length > 0) {
      worldStructureJson = JSON.parse(readFileSync(join(worldStructuresDir, wsFiles[0]), "utf8"));
      console.log(`  Found WorldStructure: ${wsFiles[0]}`);
    }
  }

  const biomesDir = join(hytaleGenRoot!, "Biomes");
  if (existsSync(biomesDir)) {
    const files = readdirSync(biomesDir).filter((f: string) => f.endsWith(".json"));
    for (const f of files) {
      const data = JSON.parse(readFileSync(join(biomesDir, f), "utf8"));
      biomeFiles.push({ name: basename(f, ".json"), data });
    }
    console.log(`  Found ${biomeFiles.length} biome file(s)`);
  }
}

if (biomeFiles.length === 0) {
  console.error("No biome files found to import.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Create output directory structure
// ---------------------------------------------------------------------------

const templateDir = join("templates", templateName);
const outSettings = join(templateDir, "HytaleGenerator", "Settings");
const outWorlds = join(templateDir, "HytaleGenerator", "WorldStructures");
const outBiomes = join(templateDir, "HytaleGenerator", "Biomes");

for (const dir of [outSettings, outWorlds, outBiomes]) {
  mkdirSync(dir, { recursive: true });
}

console.log(`\nWriting to ${templateDir}/`);

// ---------------------------------------------------------------------------
// 1. Settings.json
// ---------------------------------------------------------------------------

const defaultSettings = {
  CustomConcurrency: -1,
  BufferCapacityFactor: 0.4,
  TargetViewDistance: 1024.0,
  TargetPlayerCount: 8.0,
  StatsCheckpoints: [],
};

writeFileSync(
  join(outSettings, "Settings.json"),
  settingsJson ?? JSON.stringify(defaultSettings, null, 2),
);
console.log("  Settings.json" + (settingsJson ? " (pass-through)" : " (default)"));

// ---------------------------------------------------------------------------
// 2. WorldStructures/MainWorld.json
// ---------------------------------------------------------------------------

function toPascalCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toBiomeId(slug: string): string {
  return slug
    .split(/[-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_");
}

if (worldStructureJson) {
  // Reverse-transform Density subtree if it has $NodeId (Hytale native format)
  const ws = { ...worldStructureJson };
  if (ws.Density && typeof ws.Density === "object" && isHytaleNativeFormat(ws.Density as Record<string, unknown>)) {
    const { asset } = hytaleToInternal(ws.Density as Record<string, unknown>);
    ws.Density = asset;
  }
  // Remove $NodeId at WorldStructure level if present
  delete ws.$NodeId;
  // Add Framework for internal format
  ws.Framework = {};
  writeFileSync(join(outWorlds, "MainWorld.json"), JSON.stringify(ws, null, 2));
  console.log("  MainWorld.json (density reverse-translated)");
} else {
  // Generate default WorldStructure with biome reference
  const biomeId = biomeFiles[0].data.Name as string ?? toBiomeId(templateName);
  const defaultWorld = {
    Type: "NoiseRange",
    DefaultBiome: biomeId,
    DefaultTransitionDistance: 24,
    MaxBiomeEdgeDistance: 48,
    Biomes: [{ Biome: biomeId, Min: -1.0, Max: 1.0 }],
    Density: {
      Type: "SimplexNoise2D",
      Frequency: 0.001,
      Amplitude: 1.0,
      Seed: "world_biome",
      Octaves: 3,
      Lacunarity: 2.0,
      Gain: 0.5,
    },
    ContentFields: [
      { Type: "BaseHeight", Name: "Base", Y: 100 },
      { Type: "BaseHeight", Name: "Water", Y: 100 },
      { Type: "BaseHeight", Name: "Bedrock", Y: 0 },
    ],
  };
  writeFileSync(join(outWorlds, "MainWorld.json"), JSON.stringify(defaultWorld, null, 2));
  console.log("  MainWorld.json (generated default)");
}

// ---------------------------------------------------------------------------
// 3. Biome files
// ---------------------------------------------------------------------------

for (const { name, data } of biomeFiles) {
  let outputData: Record<string, unknown>;

  if (isHytaleNativeFormat(data)) {
    const { wrapper } = hytaleToInternalBiome(data);
    outputData = wrapper;
    console.log(`  ${name} → converted from Hytale native format`);
  } else {
    // Already internal format — pass through
    outputData = data;
    console.log(`  ${name} → already internal format (pass-through)`);
  }

  // Output filename: PascalCase + Biome.json suffix
  const pascalName = toPascalCase(name.replace(/Biome$/i, ""));
  const outputFilename = `${pascalName}Biome.json`;
  writeFileSync(join(outBiomes, outputFilename), JSON.stringify(outputData, null, 2));
}

// ---------------------------------------------------------------------------
// 4. Generate manifest.json
// ---------------------------------------------------------------------------

function toDisplayName(slug: string): string {
  return slug
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const manifest = {
  name: flags.name ?? toDisplayName(templateName),
  description: flags.description ?? "Imported from Hytale native format.",
  version: "0.1.0",
  serverVersion: "2026.02.05",
  category: flags.category ?? "Fantasy",
};

writeFileSync(join(templateDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("  manifest.json");

console.log(`\nImport complete → ${templateDir}`);
