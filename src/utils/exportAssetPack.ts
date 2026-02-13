import { save, open } from "@tauri-apps/plugin-dialog";
import { useProjectStore } from "@/stores/projectStore";
import { useEditorStore } from "@/stores/editorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useToastStore } from "@/stores/toastStore";
import { graphToJson, graphToJsonMulti } from "@/utils/graphToJson";
import { normalizeExport, isBiomeFile, isSettingsFile, internalToHytaleBiome } from "@/utils/fileTypeDetection";
import { exportAssetFile, copyFile, readAssetFile, listDirectory } from "@/utils/ipc";
import type { DirectoryEntryData } from "@/utils/ipc";

/**
 * BFS upstream from a root node to collect all nodes feeding into it.
 */
function getReachableNodeIds(
  rootId: string,
  _nodes: import("@xyflow/react").Node[],
  edges: import("@xyflow/react").Edge[],
): Set<string> {
  const result = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (result.has(current)) continue;
    result.add(current);
    for (const edge of edges) {
      if (edge.target === current && !result.has(edge.source)) {
        queue.push(edge.source);
      }
    }
  }
  return result;
}

/**
 * Serialize the currently open file to Hytale-compatible JSON.
 * Mirrors the logic from handleSaveFile in useTauriIO.ts but does NOT write to disk or modify state.
 */
export function serializeCurrentFile(): Record<string, unknown> | null {
  const currentFile = useProjectStore.getState().currentFile;
  if (!currentFile) return null;

  const { nodes, edges, originalWrapper, biomeRanges, noiseRangeConfig, editingContext, settingsConfig, biomeConfig, biomeSections, activeBiomeSection, outputNodeId } = useEditorStore.getState();

  // NoiseRange files
  if (originalWrapper?.Type === "NoiseRange") {
    const output = { ...originalWrapper } as Record<string, unknown>;
    output.Biomes = biomeRanges.map((r) => ({ Biome: r.Biome, Min: r.Min, Max: r.Max }));
    if (noiseRangeConfig) {
      output.DefaultBiome = noiseRangeConfig.DefaultBiome;
      output.DefaultTransitionDistance = noiseRangeConfig.DefaultTransitionDistance;
      output.MaxBiomeEdgeDistance = noiseRangeConfig.MaxBiomeEdgeDistance;
    }
    const densityJson = graphToJson(nodes, edges);
    if (densityJson) output.Density = densityJson;
    return normalizeExport(output, nodes) as Record<string, unknown>;
  }

  // Settings files
  if (editingContext === "Settings" && settingsConfig && originalWrapper) {
    const output: Record<string, unknown> = { ...originalWrapper };
    output.CustomConcurrency = settingsConfig.CustomConcurrency;
    output.BufferCapacityFactor = settingsConfig.BufferCapacityFactor;
    output.TargetViewDistance = settingsConfig.TargetViewDistance;
    output.TargetPlayerCount = settingsConfig.TargetPlayerCount;
    output.StatsCheckpoints = settingsConfig.StatsCheckpoints;
    return output;
  }

  // Biome files
  if (editingContext === "Biome" && originalWrapper && biomeConfig && biomeSections) {
    const updatedSections = { ...biomeSections };
    if (activeBiomeSection && updatedSections[activeBiomeSection]) {
      updatedSections[activeBiomeSection] = {
        ...updatedSections[activeBiomeSection],
        nodes: structuredClone(nodes),
        edges: structuredClone(edges),
        outputNodeId: outputNodeId ?? null,
      };
    }

    const output = { ...originalWrapper } as Record<string, unknown>;
    output.Name = biomeConfig.Name;

    if (updatedSections["Terrain"]) {
      const terrainJson = graphToJson(updatedSections["Terrain"].nodes, updatedSections["Terrain"].edges);
      const origTerrain = (originalWrapper.Terrain ?? {}) as Record<string, unknown>;
      output.Terrain = { ...origTerrain, Density: terrainJson };
    }

    if (updatedSections["MaterialProvider"]) {
      const matJson = graphToJson(updatedSections["MaterialProvider"].nodes, updatedSections["MaterialProvider"].edges);
      if (matJson) output.MaterialProvider = matJson;
    }

    const propKeys = Object.keys(updatedSections).filter((k) => k.startsWith("Props[")).sort();
    const props: Record<string, unknown>[] = [];
    for (let i = 0; i < propKeys.length; i++) {
      const section = updatedSections[propKeys[i]];
      const meta = biomeConfig.propMeta[i] ?? { Runtime: 0, Skip: false };
      const propEntry: Record<string, unknown> = { Runtime: meta.Runtime, Skip: meta.Skip };

      const sectionNodes = section.nodes;
      const sectionEdges = section.edges;

      const positionsRoot = sectionNodes.find((n) => (n.data as Record<string, unknown>)?._biomeField === "Positions");
      const assignmentsRoot = sectionNodes.find((n) => (n.data as Record<string, unknown>)?._biomeField === "Assignments");

      if (positionsRoot || assignmentsRoot) {
        if (positionsRoot) {
          const posNodeIds = getReachableNodeIds(positionsRoot.id, sectionNodes, sectionEdges);
          const posNodes = sectionNodes.filter((n) => posNodeIds.has(n.id));
          const posEdges = sectionEdges.filter((e) => posNodeIds.has(e.source) && posNodeIds.has(e.target));
          const posJson = graphToJson(posNodes, posEdges);
          if (posJson) propEntry.Positions = posJson;
        }
        if (assignmentsRoot) {
          const asgnNodeIds = getReachableNodeIds(assignmentsRoot.id, sectionNodes, sectionEdges);
          const asgnNodes = sectionNodes.filter((n) => asgnNodeIds.has(n.id));
          const asgnEdges = sectionEdges.filter((e) => asgnNodeIds.has(e.source) && asgnNodeIds.has(e.target));
          const asgnJson = graphToJson(asgnNodes, asgnEdges);
          if (asgnJson) propEntry.Assignments = asgnJson;
        }
      } else {
        const assets = graphToJsonMulti(sectionNodes, sectionEdges);
        if (assets[0]) propEntry.Positions = assets[0];
        if (assets[1]) propEntry.Assignments = assets[1];
      }

      props.push(propEntry);
    }
    output.Props = props;
    output.EnvironmentProvider = biomeConfig.EnvironmentProvider;
    output.TintProvider = biomeConfig.TintProvider;

    return internalToHytaleBiome(output) as Record<string, unknown>;
  }

  // Regular typed asset
  const json = graphToJson(nodes, edges);
  if (!json) return null;

  if (originalWrapper) {
    if ("Type" in originalWrapper) {
      return normalizeExport(json, nodes) as Record<string, unknown>;
    }
    // Non-typed wrapper
    const output = { ...originalWrapper };
    let replaced = false;
    for (const [key, val] of Object.entries(output)) {
      if (val && typeof val === "object" && "Type" in (val as Record<string, unknown>)) {
        output[key] = normalizeExport(json, nodes);
        replaced = true;
        break;
      }
    }
    return (replaced ? output : normalizeExport(json, nodes)) as Record<string, unknown>;
  }

  return normalizeExport(json, nodes) as Record<string, unknown>;
}

/**
 * Export the currently open file as a standalone JSON to a user-chosen location.
 * Does NOT modify editor state (dirty flag, currentFile, etc.).
 */
export async function exportCurrentJson(): Promise<void> {
  const addToast = useToastStore.getState().addToast;

  try {
    const json = serializeCurrentFile();
    if (!json) {
      addToast("No file open to export", "error");
      return;
    }

    const exportPath = useSettingsStore.getState().exportPath;
    const filePath = await save({
      defaultPath: exportPath ?? undefined,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!filePath) return;

    await exportAssetFile(filePath, json);

    // Remember the directory portion for next time
    const dirPortion = filePath.replace(/[/\\][^/\\]+$/, "");
    useSettingsStore.getState().setExportPath(dirPortion);

    addToast(`Exported to ${filePath}`, "success");
  } catch (err) {
    addToast(`Export failed: ${err}`, "error");
  }
}

/**
 * Flatten a directory tree into a list of file entries.
 */
function flattenEntries(entries: DirectoryEntryData[], basePath: string): { path: string; isDir: boolean }[] {
  const result: { path: string; isDir: boolean }[] = [];
  for (const entry of entries) {
    const fullPath = `${basePath}/${entry.name}`;
    result.push({ path: fullPath, isDir: entry.is_dir });
    if (entry.children) {
      result.push(...flattenEntries(entry.children, fullPath));
    }
  }
  return result;
}

/**
 * Convert a single JSON asset file from disk to Hytale-native format.
 * Reads from disk, detects type, applies conversion, and returns the output JSON.
 */
async function convertFileForExport(sourcePath: string): Promise<Record<string, unknown> | null> {
  const rawContent = await readAssetFile(sourcePath);
  if (!rawContent || typeof rawContent !== "object") return rawContent as Record<string, unknown> | null;

  const content = rawContent as Record<string, unknown>;

  // Settings files pass through unchanged
  if (isSettingsFile(content, sourcePath)) {
    return content;
  }

  // Biome wrapper files
  if (isBiomeFile(content, sourcePath)) {
    return internalToHytaleBiome(content) as Record<string, unknown>;
  }

  // Typed assets
  if ("Type" in content) {
    return normalizeExport(content) as Record<string, unknown>;
  }

  // Non-typed wrapper with typed children
  const output = { ...content };
  for (const [key, val] of Object.entries(output)) {
    if (val && typeof val === "object" && "Type" in (val as Record<string, unknown>)) {
      output[key] = normalizeExport(val as Record<string, unknown>);
    }
  }
  return output;
}

/**
 * Export the entire asset pack to a user-chosen directory.
 * Copies all files, converting JSON assets to Hytale-native format.
 */
export async function exportAssetPack(): Promise<void> {
  const addToast = useToastStore.getState().addToast;

  try {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) {
      addToast("No project open to export", "error");
      return;
    }

    const exportPath = useSettingsStore.getState().exportPath;
    const targetDir = await open({
      directory: true,
      defaultPath: exportPath ?? undefined,
    });
    if (!targetDir) return;

    // Remember the chosen path
    useSettingsStore.getState().setExportPath(targetDir);

    // Get all files recursively
    const entries = await listDirectory(projectPath);
    const allFiles = flattenEntries(entries, projectPath).filter((f) => !f.isDir);

    let exportedCount = 0;
    for (const file of allFiles) {
      // Compute relative path from project root
      const relativePath = file.path.slice(projectPath.length);
      const destPath = `${targetDir}${relativePath}`;

      if (file.path.toLowerCase().endsWith(".json")) {
        // Convert JSON files through the export pipeline
        try {
          const converted = await convertFileForExport(file.path);
          if (converted) {
            await exportAssetFile(destPath, converted);
          }
        } catch {
          // If conversion fails, copy as-is
          await copyFile(file.path, destPath);
        }
      } else {
        // Non-JSON files: copy directly
        await copyFile(file.path, destPath);
      }
      exportedCount++;
    }

    addToast(`Exported ${exportedCount} files to ${targetDir}`, "success");
  } catch (err) {
    addToast(`Export failed: ${err}`, "error");
  }
}
