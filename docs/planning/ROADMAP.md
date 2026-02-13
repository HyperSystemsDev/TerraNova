# TerraNova — Implementation Roadmap

**Version:** 1.1
**Date:** 2026-02-10
**Organization:** HyperSystemsDev

---

## Overview

Five-phase roadmap building TerraNova from an empty repo to a full-featured worldgen design studio. Each phase delivers a usable product increment. Dependencies flow forward — each phase builds on the previous.

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──────────→ Phase 5
App Shell    Node Graph   Sub-Editors  Preview Engine      Templates
+ I/O        Editor       (Curves,     (Noise, 2D/3D,     Hub
              (200+ nodes) Biome Range, Voxel, World)
              Auto-layout  Materials)        │
                                             └──→ Phase 4B
                                                  Bridge +
                                                  World Preview
```

**Target Hytale Version:** Pre-release `2026.02.05-9ce2783f7`

---

## Phase 1: App Shell + Asset Pack I/O

**Goal:** Open, browse, edit, and save V2 asset pack directories through a GUI.

**Deliverable:** Users can open an existing V2 asset pack, edit field values in property panels, and save valid JSON. No node graph yet — structured form editing.

### Milestone 1.1: Project Scaffolding

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.1.1 | Initialize Tauri v2 project (`create-tauri-app` with React + TypeScript + Vite) | None |
| 1.1.2 | Configure pnpm, Tailwind CSS, ESLint, Prettier | 1.1.1 |
| 1.1.3 | Configure Rust workspace: `Cargo.toml` with serde, serde_json, tauri | 1.1.1 |
| 1.1.4 | Set up GitHub repo (`HyperSystemsDev/TerraNova`), branch protection, CI skeleton | 1.1.1 |
| 1.1.5 | Create project directory structure matching spec | 1.1.1 |

**Acceptance:** `pnpm tauri dev` launches a blank Tauri window. Rust backend compiles. CI runs.

### Milestone 1.2: App Shell UI

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.2.1 | Implement dark theme with Tailwind (charcoal bg, light text, accent colors) | 1.1.2 |
| 1.2.2 | Build resizable panel layout: sidebar (left), main content (center), properties (right) | 1.2.1 |
| 1.2.3 | Build toolbar: File menu (New, Open, Save, Save As), Edit menu (Undo, Redo), View menu | 1.2.1 |
| 1.2.4 | Build status bar (bottom): current file, validation status, save indicator | 1.2.1 |
| 1.2.5 | Implement panel resize drag handles with persistence (save layout to localStorage) | 1.2.2 |

**Acceptance:** App shell renders with three resizable panels, toolbar, and status bar. Dark theme applied globally.

### Milestone 1.3: Rust Schema Definitions

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.3.1 | Define core Rust types: `AssetType` enum, `AssetValue` (serde-based polymorphic), base fields (`Type`, `Skip`, `ExportAs`) | 1.1.3 |
| 1.3.2 | Define density function types (68 types) with all fields and defaults | 1.3.1 |
| 1.3.3 | Define curve types (19), pattern types (15), material provider types (14 + sub-types) | 1.3.1 |
| 1.3.4 | Define position providers (14), props (11), scanners (5), assignments (5) | 1.3.1 |
| 1.3.5 | Define vector providers (5), environment/tint (4), framework (2), block masks, settings | 1.3.1 |
| 1.3.6 | Define biome, terrain, world structure, directionality types | 1.3.1 |
| 1.3.7 | Implement validation rules: required fields, value constraints, type checking | 1.3.2–1.3.6 |
| 1.3.8 | Write unit tests for serialization round-trip (JSON → Rust → JSON) | 1.3.2–1.3.6 |

**Acceptance:** All 200+ V2 types deserialize from real Hytale JSON and reserialize to identical output. Validation catches known constraint violations.

### Milestone 1.4: Asset Pack I/O

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.4.1 | Implement Tauri command: `open_asset_pack` — directory dialog, recursive JSON scan | 1.3.1 |
| 1.4.2 | Implement Tauri command: `save_asset_pack` — atomic write (temp + rename) | 1.3.1 |
| 1.4.3 | Implement Tauri command: `validate_asset_pack` — full schema validation | 1.3.7 |
| 1.4.4 | Implement Tauri command: `read_file`, `write_file` — single file operations | 1.3.1 |
| 1.4.5 | Implement Tauri command: `list_directory` — directory tree for sidebar | 1.1.3 |
| 1.4.6 | Wire IPC: React `useTauriIO` hook wrapping all commands | 1.4.1–1.4.5 |

**Acceptance:** Open a real Hytale asset pack directory → all files listed → edit a value → save → file modified on disk.

### Milestone 1.5: Asset Tree + Property Panel

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.5.1 | Build `AssetTree.tsx`: file tree component with icons per category (Biomes, Density, etc.) | 1.2.2, 1.4.5 |
| 1.5.2 | Build `PropertyPanel.tsx`: auto-generated form from asset schema | 1.2.2 |
| 1.5.3 | Implement field controls: `SliderField`, `DropdownField`, `VectorField`, `ToggleField`, `TextField`, `ColorPickerField`, `ArrayField` | 1.5.2 |
| 1.5.4 | TypeScript schema definitions (`src/schema/types.ts`): all V2 type interfaces | 1.5.2 |
| 1.5.5 | Default values map (`src/schema/defaults.ts`): every type's default field values | 1.5.4 |
| 1.5.6 | Inline validation on property fields (red borders, error tooltips) | 1.5.3, 1.5.4 |
| 1.5.7 | Connect: click tree item → load JSON → display in property panel → edit → save | 1.5.1, 1.5.3, 1.4.6 |

**Acceptance:** Full edit workflow: open pack → click file → edit fields → save → valid JSON output.

### Milestone 1.6: New Project + Bundled Template

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1.6.1 | Bundle "Void" template: minimal asset pack (WorldStructure with one empty biome) | 1.3.6 |
| 1.6.2 | Implement "New Project" wizard: name, location, template selection | 1.2.3 |
| 1.6.3 | Implement `create_from_template` Tauri command: copy template to target | 1.4.1 |

**Acceptance:** New Project → select Void → creates directory → opens in editor → saves valid JSON loadable by Hytale server.

---

## Phase 2: Node Graph Editor

**Goal:** Visual node graph for density functions and all V2 asset types.

**Deliverable:** Full visual node graph editor comparable to (and better organized than) Hytale's built-in editor.

### Milestone 2.1: React Flow Integration

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.1.1 | Install and configure `@xyflow/react` v12 with dark theme (`colorMode="dark"`) | Phase 1 |
| 2.1.2 | Build `EditorCanvas.tsx`: React Flow wrapper with zoom, pan, grid background | 2.1.1 |
| 2.1.3 | Define handle types: density, curve, material, pattern, position, scanner, assignment, vector | 2.1.1 |
| 2.1.4 | Build shared base node component: header (type name + color), body (field summary), handles | 2.1.1 |
| 2.1.5 | Implement `ConnectionValidator.tsx`: type-safe handle validation (density→density, etc.) | 2.1.3 |

**Acceptance:** Canvas renders with pan/zoom. Nodes connect with type validation. Invalid connections rejected visually.

### Milestone 2.2: Zustand State + Graph ↔ JSON Sync

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.2.1 | Build `editorStore.ts`: Zustand store for React Flow nodes, edges, selection state | 2.1.1 |
| 2.2.2 | Build `graphToJson.ts`: convert React Flow graph → V2 JSON structure | 2.2.1 |
| 2.2.3 | Build `jsonToGraph.ts`: convert V2 JSON → React Flow nodes + edges | 2.2.1 |
| 2.2.4 | Implement bidirectional sync: graph changes → JSON update, JSON load → graph render | 2.2.2, 2.2.3 |
| 2.2.5 | Round-trip test suite: load JSON → graph → JSON → compare | 2.2.4 |

**Acceptance:** Load real Hytale JSON → renders as graph → export → output matches original (field preservation).

### Milestone 2.3: Custom Node Components (Density — 68 types)

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.3.1 | Build density node components — noise generators: SimplexNoise2D, SimplexNoise3D, CellNoise2D, CellNoise3D (4 nodes) | 2.1.4 |
| 2.3.2 | Build density node components — math operations: Constant, Sum, Multiplier, Abs, Inverter, Sqrt, Pow, OffsetConstant, AmplitudeConstant (9 nodes) | 2.1.4 |
| 2.3.3 | Build density node components — clamping: Clamp, SmoothClamp, Floor, SmoothFloor, Ceiling, SmoothCeiling, Min, SmoothMin, Max, SmoothMax (10 nodes) | 2.1.4 |
| 2.3.4 | Build density node components — mapping: Normalizer, CurveMapper, Offset, Amplitude (4 nodes) | 2.1.4 |
| 2.3.5 | Build density node components — mixing: Mix, MultiMix (2 nodes) | 2.1.4 |
| 2.3.6 | Build density node components — transforms: Scale, Slider, Rotator, Anchor, XOverride, YOverride, ZOverride (7 nodes) | 2.1.4 |
| 2.3.7 | Build density node components — warping: GradientWarp, FastGradientWarp, VectorWarp (3 nodes) | 2.1.4 |
| 2.3.8 | Build density node components — shapes: Distance, Cube, Ellipsoid, Cuboid, Cylinder, Plane, Axis, Shell, Angle (9 nodes) | 2.1.4 |
| 2.3.9 | Build density node components — accessors: XValue, YValue, ZValue, Terrain, BaseHeight, CellWallDistance, DistanceToBiomeEdge (7 nodes) | 2.1.4 |
| 2.3.10 | Build density node components — remaining: Gradient, Cache, Cache2D, YSampled, Switch, SwitchState, PositionsCellNoise, Positions3D, PositionsPinch, PositionsTwist, Exported, Imported, Pipeline (13 nodes) | 2.1.4 |

**Acceptance:** All 68 density nodes render with correct handles, colors (blue), and field displays.

### Milestone 2.4: Custom Node Components (Other Categories)

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.4.1 | Build material provider node components (14 types) — orange color | 2.1.4 |
| 2.4.2 | Build curve node components (19 types) — purple color | 2.1.4 |
| 2.4.3 | Build pattern node components (15 types) — yellow color | 2.1.4 |
| 2.4.4 | Build position provider node components (14 types) — green color | 2.1.4 |
| 2.4.5 | Build prop node components (11 types + 4 directionality) | 2.1.4 |
| 2.4.6 | Build scanner node components (5 types) — teal color | 2.1.4 |
| 2.4.7 | Build assignment node components (5 types) | 2.1.4 |
| 2.4.8 | Build vector provider node components (5 types) | 2.1.4 |
| 2.4.9 | Build environment/tint node components (4 types) | 2.1.4 |
| 2.4.10 | Build block mask, framework, settings node components | 2.1.4 |

**Note:** Tasks 2.3.* and 2.4.* are highly parallelizable — each node type is independent.

**Acceptance:** All 200+ V2 types have custom node components with correct colors, handles, and field displays.

### Milestone 2.5: Node Palette

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.5.1 | Build `NodePalette.tsx`: categorized list of all node types | 2.3.*, 2.4.* |
| 2.5.2 | Implement search/filter in palette | 2.5.1 |
| 2.5.3 | Implement drag-from-palette-to-canvas to add nodes | 2.5.1, 2.1.2 |
| 2.5.4 | Implement double-click palette item to add at center | 2.5.1 |
| 2.5.5 | Context-aware filtering: when editing density, show only density-compatible types | 2.5.1 |

**Acceptance:** All types browsable by category. Search is instant (<100ms). Drag-to-add works.

### Milestone 2.6: Editor Features

| Task | Description | Dependencies |
|------|-------------|-------------|
| 2.6.1 | Auto-layout via `@dagrejs/dagre` — one-click organize button | 2.2.1 |
| 2.6.2 | Enable React Flow minimap | 2.1.2 |
| 2.6.3 | Undo/redo: command pattern over Zustand (add/delete/move/connect/disconnect/edit) | 2.2.1 |
| 2.6.4 | Keyboard shortcuts: Delete, Ctrl+Z, Ctrl+Y, Ctrl+F, Ctrl+A, Space-pan, Ctrl+G, Ctrl+S | 2.2.1 |
| 2.6.5 | Node search (Ctrl+F): find by type name, display name, field value | 2.2.1 |
| 2.6.6 | Collapsible groups: select → "Create Group" → single collapsed node | 2.2.1 |
| 2.6.7 | Hover tooltips: type description + field documentation from V2 docs | 2.1.4 |
| 2.6.8 | Multi-select + bulk operations (delete, move, group) | 2.2.1 |

**Acceptance:** Auto-layout handles 100-node graphs. Undo/redo works for all operations. Search finds nodes instantly.

---

## Phase 3: Specialized Sub-Editors

**Goal:** Purpose-built editors for subsystems that don't map well to generic node graphs.

**Deliverable:** Every V2 subsystem has an appropriate editor.

### Milestone 3.1: Biome Range Editor ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.1.1 | Build horizontal axis component: noise value [-1.0, 1.0] | Phase 2 | ✅ |
| 3.1.2 | Build draggable range blocks (one per biome) on the axis | 3.1.1 | ✅ |
| 3.1.3 | Implement overlap detection and warnings | 3.1.2 | ✅ |
| 3.1.4 | Wire to BiomeRangeAsset[] JSON (Min/Max fields) | 3.1.2 | ✅ |
| 3.1.5 | Add DefaultTransitionDistance slider | 3.1.1 | ✅ |

**Acceptance:** Dragging range blocks updates BiomeRangeAsset Min/Max. Overlaps highlighted.

### Milestone 3.1b: Biome Section Editor ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.1b.1 | Add `idPrefix` to `jsonToGraph` for multi-subtree ID isolation | 3.1 | ✅ |
| 3.1b.2 | Extend editorStore with BiomeConfig, biomeSections, activeBiomeSection, switchBiomeSection | 3.1 | ✅ |
| 3.1b.3 | Build `BiomeSectionTabs.tsx`: color-coded tab bar (Terrain, Materials, Prop 0…N) | 3.1b.2 | ✅ |
| 3.1b.4 | Extend CenterPanel with Biome editing context | 3.1b.3 | ✅ |
| 3.1b.5 | Biome file detection + section extraction in useTauriIO (load) | 3.1b.2 | ✅ |
| 3.1b.6 | Biome reassembly + save logic in useTauriIO (save) | 3.1b.5 | ✅ |
| 3.1b.7 | PropertyPanel: biome config (Name, TintProvider, EnvironmentProvider, Prop Runtime/Skip) | 3.1b.2 | ✅ |
| 3.1b.8 | fitView on section switch in EditorCanvas | 3.1b.3 | ✅ |
| 3.1b.9 | Biome round-trip tests (detection, MaterialProvider, idPrefix, graphToJsonMulti) | 3.1b.5 | ✅ |

**Acceptance:** Opening a biome file (e.g., ForestHillsBiome.json) renders section tabs. Each section's graph is preserved when switching. Save reassembles the full biome JSON. All tests pass.

### Milestone 3.2: Curve Editor ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.2.1 | Build 2D Canvas with X-axis (input) and Y-axis (output) | Phase 2 | ✅ |
| 3.2.2 | Render Manual curve as piecewise linear segments | 3.2.1 | ✅ |
| 3.2.3 | Implement draggable control points (PointInOutAsset) | 3.2.2 | ✅ |
| 3.2.4 | Add/remove points on click | 3.2.3 | ✅ |
| 3.2.5 | Wire to Manual curve JSON (Points[] field) | 3.2.3 | ✅ |
| 3.2.6 | Render read-only previews for computed curve types (DistanceExponential, DistanceS, etc.) | 3.2.1 | ✅ |

**Acceptance:** Editing Manual curve points at 60fps. JSON output matches PointInOutAsset format exactly.

### Milestone 3.3: Material Layer Stack ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.3.1 | Build vertical stack component (like Photoshop layers) | Phase 2 | ✅ |
| 3.3.2 | Render each SpaceAndDepth layer: material name + thickness + type badge | 3.3.1 | ✅ |
| 3.3.3 | Implement drag-to-reorder | 3.3.2 | ✅ |
| 3.3.4 | Layer type selector: ConstantThickness / NoiseThickness / RangeThickness / WeightedThickness | 3.3.2 | ✅ |
| 3.3.5 | Condition editor for layer conditions | 3.3.2 | ✅ |
| 3.3.6 | Wire to SpaceAndDepth Layers[] JSON | 3.3.3 | ✅ |
| 3.3.7 | V2 schema types: LayerType, ConditionType, LayerContextType, ConditionParameterType, 4 layer interfaces, 7 condition interfaces | 3.3.1 | ✅ |
| 3.3.8 | SpaceAndDepth V2 node component: dynamic Layers[] handles via useEdges(), V1/V2 auto-detection | 3.3.6 | ✅ |
| 3.3.9 | 4 layer node components: ConstantThickness, NoiseThickness, RangeThickness, WeightedThickness | 3.3.6 | ✅ |
| 3.3.10 | Store actions: reorderMaterialLayers, addMaterialLayer, removeMaterialLayer, changeMaterialLayerType | 3.3.3 | ✅ |
| 3.3.11 | Serialization: Layers[], Material, ThicknessFunctionXZ in NESTED_ASSET_FIELDS + FIELD_CATEGORY_PREFIX | 3.3.6 | ✅ |
| 3.3.12 | Tests: 23 new tests (V2 extraction, V2 component, serialization round-trip, store actions) | 3.3.1–3.3.11 | ✅ |

**Status:** Fully interactive `MaterialLayerStack` component with V1/V2 auto-detection. V2 mode provides drag-to-reorder (pointer events), layer type selector dropdown, condition editor (7 types with field editing for comparison conditions), add/remove layer buttons, and SpaceAndDepth settings bar (LayerContext, MaxExpectedDepth). V1 Solid/Empty graphs render in read-only mode with backward compatibility. SpaceAndDepth node component dynamically renders Layers[] handles from connected edges. 4 dedicated layer node components registered. All store actions support undo/redo via mutateAndCommit. 154 total tests passing (23 new).

**Acceptance:** Layer order maps to Layers[] array. All 4 layer types editable. Conditions configurable. ✅

### Milestone 3.4: Prop Placement Visualizer ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.4.1 | Build 2D top-down grid Canvas | Phase 2 | ✅ |
| 3.4.2 | Render position provider output as dots on grid | 3.4.1 | ✅ |
| 3.4.3 | Configurable grid resolution and world coordinate range | 3.4.1 | ✅ |
| 3.4.4 | Density overlay (color gradient for occurrence probability) | 3.4.2 | ✅ |

**Status:** Pure-TS position evaluator (`positionEvaluator.ts`) walks PositionProvider node graphs with seeded PRNG for deterministic jitter/occurrence. Supports all 14 position types (Mesh2D, Mesh3D, SimpleHorizontal, List, Occurrence, Offset, Union, Cache, SurfaceProjection, FieldFunction, Conditional, DensityBased, Exported, Imported). `PropPlacementGrid` component renders 300×300 canvas with configurable range (±32/64/128/256), seed input, grid toggle, and density overlay. Auto-evaluates on graph/range/seed changes with 200ms debounce. Hard cap at 10,000 positions.

**Acceptance:** Grid shows Mesh2D spacing/jitter distribution. Resolution adjustable. ✅

### Milestone 3.5: Hytale Export Compatibility — Bidirectional Translation Layer ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 3.5.1 | Build `translationMaps.ts`: bidirectional type name mappings (26 confirmed types), named handle ↔ `Inputs[]` index maps, `$NodeId` prefix rules per category, field category inference, clamp/normalizer field maps | Phase 2 | ✅ |
| 3.5.2 | Build `internalToHytale.ts`: recursive export transformer — type renames, `$NodeId` generation (UUID, correct prefix), `Skip: false` injection, `Frequency`→`Scale` (1/freq), `Gain`→`Persistence`, numeric→string seeds, named inputs→`Inputs[]` array, curve points `{x,y}`→`{$NodeId, In, Out}`, material strings→`{$NodeId, Solid}`, Clamp `Min/Max`→`WallA/WallB`, Normalizer range flattening, position vector flattening (Scale/Slider/Rotator), DomainWarp→FastGradientWarp field mapping, LinearTransform→AmplitudeConstant, Square→Pow, ColumnLinear scanner fields, Prefab/Column/Box prop transforms, `$NodeEditorMetadata` generation from React Flow positions, biome wrapper export | 3.5.1 | ✅ |
| 3.5.3 | Build `hytaleToInternal.ts`: recursive import transformer — `isHytaleNativeFormat()` detection, `$NodeId`/`$Comment`/`$NodeEditorMetadata`/`Skip` stripping, all export transforms reversed, `Inputs[]`→named handles distribution, category inference from `$NodeId` prefix patterns, biome wrapper import | 3.5.1 | ✅ |
| 3.5.4 | Update `defaults.ts`: all `Seed: 0`→`Seed: "A"` (string seeds), all `Material: "stone"`→`Material: "Rock_Lime_Cobble"` (Hytale registry names), `NoiseParams.Seed` type updated to `number \| string` | 3.5.1 | ✅ |
| 3.5.5 | Wire translation into `useTauriIO.ts`: auto-detect Hytale native format on import (`normalizeImport`), convert to Hytale native on export (`normalizeExport`), all save paths updated (NoiseRange, Biome, typed assets, Save As) | 3.5.2, 3.5.3 | ✅ |
| 3.5.6 | Build `hytaleTranslation.test.ts`: 54 tests covering format detection, all type mappings (both directions), `$NodeId` generation/stripping, `Skip` field handling, noise field transforms, named↔array input conversion, clamp/normalizer/position/warp/linear field transforms, curve points, material wrapping, full round-trip tests | 3.5.2, 3.5.3 | ✅ |

**Ground Truth:** 9 real biome files exported from Hytale's native editor (EndWithMushrooms, Tropical_Pirate_Islands, Mudcracks_Actual_WIP_11, TheUnderworld, HiveWorld, Lycheesis_Terrain_01, Salt_Flats, TwistWorldBiome, ParkourPancakes), cross-referenced with decompiled worldgen docs. 70+ unique types catalogued. All format decisions derived from real files — real files take precedence over docs on discrepancies.

**Coverage:** 26 confirmed type mappings, 30+ density input handle mappings, 20+ category-specific `$NodeId` prefix rules, 10+ per-type field transformers (noise, clamp, normalizer, position, warp, linear, scanner, prop), curve point format conversion, material string↔object wrapping. All transforms are bidirectional and round-trip tested.

**Status:** Files saved by TerraNova now export in Hytale-native JSON format with correct `$NodeId` prefixes, `Inputs[]` arrays, field names, and structural conventions. Files from Hytale's native editor are auto-detected and imported into TerraNova's internal format. 241 total tests passing (54 new).

**Acceptance:** Export produces JSON loadable by Hytale. Import auto-detects and normalizes Hytale native files. Round-trip preserves all data. ✅

### Milestone 3.6: Settings Panel

| Task | Description | Dependencies |
|------|-------------|-------------|
| 3.6.1 | Build form for SettingsAsset fields: CustomConcurrency, BufferCapacityFactor, TargetViewDistance, TargetPlayerCount, StatsCheckpoints | Phase 1 |

**Acceptance:** All settings editable with appropriate constraints (e.g., CustomConcurrency > -2).

---

## Phase 4: Preview Engine

**Goal:** Real-time terrain visualization from density function graphs.

**Deliverable:** Users see what their density graphs produce without running Hytale.

### Milestone 4.1: Noise Evaluation ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.1.1 | Integrate `simplex-noise` library (TypeScript Web Worker implementation) | Phase 1 | ✅ |
| 4.1.2 | Implement SimplexNoise2D evaluator: (x, z, params) → density value | 4.1.1 | ✅ |
| 4.1.3 | Implement SimplexNoise3D evaluator | 4.1.1 | ✅ |
| 4.1.4 | Implement CellNoise2D evaluator (Distance, Distance2Div, Distance2Sub, CellValue) | 4.1.1 | ✅ |
| 4.1.5 | Implement CellNoise3D evaluator | 4.1.1 | ✅ |
| 4.1.6 | Unit tests: verify noise output ranges, seed determinism, parameter effects | 4.1.2–4.1.5 | ✅ |

**Implementation Note:** Evaluation runs in TypeScript Web Workers (`densityWorker.ts`, `volumeWorker.ts`) rather than Rust — this avoids IPC overhead for per-pixel evaluation and enables progressive resolution (16³→32³→64³→128³). The `simplex-noise` library provides deterministic 2D/3D simplex noise; Voronoi/cell noise uses a custom implementation supporting all Hytale `CellType` variants including `Distance2Div`, `Distance2Sub` with configurable `Jitter`.

**Acceptance:** All noise types produce deterministic output. Parameters (Scale, Lacunarity, Persistence, Octaves, Seed) affect output correctly. ✅

### Milestone 4.2: Density Graph Evaluator ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.2.1 | Build DAG walker: topological sort + evaluation order | 4.1.1 | ✅ |
| 4.2.2 | Implement math operations: Constant, Sum (N-ary via balanced tree), Multiplier, Abs, Inverter, Sqrt, Pow | 4.2.1 | ✅ |
| 4.2.3 | Implement clamping: Clamp, SmoothClamp, Floor, SmoothFloor, Ceiling, SmoothCeiling, Min, SmoothMin, Max, SmoothMax | 4.2.1 | ✅ |
| 4.2.4 | Implement mapping: Normalizer, CurveMapper, Offset, Amplitude | 4.2.1 | ✅ |
| 4.2.5 | Implement mixing: Mix, MultiMix | 4.2.1 | ✅ |
| 4.2.6 | Implement coordinate transforms: Scale, Slider, XOverride, YOverride, ZOverride | 4.2.1 | ✅ |
| 4.2.7 | Implement warping: GradientWarp, FastGradientWarp, VectorWarp | 4.2.1 | ✅ |
| 4.2.8 | Implement shape primitives: Distance, Cube, Ellipsoid, Cuboid, Cylinder, Plane, Axis | 4.2.1 | ✅ |
| 4.2.9 | Implement coordinate accessors: XValue, YValue, ZValue | 4.2.1 | ✅ |
| 4.2.10 | Implement context: BaseHeight (resolves from WorldStructure ContentFields), Terrain, CellWallDistance, DistanceToBiomeEdge | 4.2.1 | ✅ |
| 4.2.11 | Implement caching: Cache, YSampled | 4.2.1 | ✅ |
| 4.2.12 | Implement Gradient, Anchor, Rotator, Exported, PositionsCellNoise | 4.2.1 | ✅ |

**Status:** 50+ of 68 density types correctly evaluate. `EvaluationOptions` interface supports `contentFields` (e.g. `{ Base: 100, Water: 100, Bedrock: 0 }` from WorldStructure). Smooth operations use exponential smoothing. N-ary Sum nodes auto-flatten to balanced binary trees. 362+ new density evaluator tests.

**Acceptance:** 40+ of 68 density types correctly evaluate. Complex graphs (20+ nodes) produce meaningful output. ✅

### Milestone 4.3: Sample Grid + Evaluation Pipeline ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.3.1 | Implement NxN grid evaluation via Web Workers (density + volume) | 4.2.* | ✅ |
| 4.3.2 | Build `densityWorkerClient.ts` / `volumeWorkerClient.ts`: managed worker lifecycle with evaluate/cancel API | 4.3.1 | ✅ |
| 4.3.3 | Transfer Float32Array results from workers (structured clone, zero-copy) | 4.3.2 | ✅ |
| 4.3.4 | Build `usePreviewEvaluation.ts` hook: debounced invocation on graph/slider changes, progressive resolution | 4.3.3 | ✅ |
| 4.3.5 | Build `useVoxelEvaluation.ts` hook: 3D volume evaluation with progressive resolution (16³→32³→64³→128³) | 4.3.3 | ✅ |
| 4.3.6 | Build `useComparisonEvaluation.ts` hook: side-by-side evaluation for comparison view | 4.3.4 | ✅ |
| 4.3.7 | Copy/Paste nodes + inline density thumbnails | 4.3.4 | ✅ |

**Acceptance:** 128x128 grid evaluates in <100ms via Web Worker. Progressive resolution provides instant feedback. ✅

### Milestone 4.4: 2D Heatmap Preview ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.4.1 | Build `Heatmap2D.tsx`: Canvas-rendered density map with configurable colormaps | 4.3.4 | ✅ |
| 4.4.2 | Configurable color ramp: blue-red, grayscale, terrain, viridis, magma, and more | 4.4.1 | ✅ |
| 4.4.3 | Configurable sample range (world coordinates) and resolution (16–512) | 4.4.1 | ✅ |
| 4.4.4 | Per-node preview: click density node → show its isolated output | 4.4.1 | ✅ |
| 4.4.5 | Pan/zoom with mouse (wheel + drag), contour lines, cross-section tool | 4.4.1 | ✅ |
| 4.4.6 | `ThresholdedHeatmap.tsx`: binary solid/air terrain view (density ≥ 0 = solid) | 4.4.1 | ✅ |
| 4.4.7 | Statistics panel: histogram, min/max/mean, log scale toggle | 4.4.1 | ✅ |

**Acceptance:** Heatmap updates within 200ms of slider change. Resolution configurable from 16x16 to 512x512. ✅

### Milestone 4.5: 3D Terrain Mesh Preview ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.5.1 | Install `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` | 4.3.4 | ✅ |
| 4.5.2 | Build `Preview3D.tsx`: PlaneGeometry with vertex Y displacement from density array | 4.5.1 | ✅ |
| 4.5.3 | OrbitControls for camera rotation/zoom/pan | 4.5.2 | ✅ |
| 4.5.4 | Configurable mesh resolution (32x32 to 256x256) | 4.5.2 | ✅ |
| 4.5.5 | Wireframe toggle, fog, sky | 4.5.2 | ✅ |
| 4.5.6 | Height-based terrain coloring + water plane with animated shader | 4.5.2 | ✅ |

**Acceptance:** 3D mesh accurately represents density output. Camera controls smooth at 60fps. Resolution adjustable. ✅

### Milestone 4.6: Preview Panel ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.6.1 | Build `PreviewControls.tsx`: toggle 2D/3D/Voxel/World, resolution slider, range controls, mode-specific options | 4.4.1, 4.5.2 | ✅ |
| 4.6.2 | Side-by-side comparison mode (`ComparisonView.tsx`) with linked/unlinked cameras | 4.6.1 | ✅ |
| 4.6.3 | Integrate preview panel into main layout with split/preview/graph/compare view modes | 4.6.1 | ✅ |
| 4.6.4 | PNG export from any preview mode | 4.6.1 | ✅ |

**Acceptance:** Preview toggles between 2D, 3D, Voxel, and World. Side-by-side comparison works. ✅

### Milestone 4.7: Inline Node Preview Thumbnails ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.7.1 | Design thumbnail rendering pipeline: per-node evaluation, throttled, subgraph isolation | 4.3.4, 4.4.1 | ✅ |
| 4.7.2 | Build `NodeThumbnail.tsx`: 64x64 Canvas inside node card body | 4.7.1 | ✅ |
| 4.7.3 | Selective rendering: only visible nodes in viewport | 4.7.2 | ✅ |
| 4.7.4 | Dirty propagation: upstream changes invalidate downstream thumbnails | 4.7.2 | ✅ |
| 4.7.5 | Subgraph evaluation isolation: prune DAG to ancestor subtree per node | 4.2.1 | ✅ |
| 4.7.6 | Thumbnail colormap reuses active colormap from preview controls | 4.4.2 | ✅ |
| 4.7.7 | User preference toggle: "Show inline previews" (persisted, default off) | 4.7.2 | ✅ |
| 4.7.8 | Integration with BaseNode: density nodes only, conditionally rendered | 4.7.2 | ✅ |

**Acceptance:** Density nodes display inline 64x64 heatmap thumbnails. Thumbnails update within 500ms of parameter changes. Scrolling/panning remains at 60fps with thumbnails enabled. ✅

### Milestone 4.9: Voxel Preview Engine ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.9.1 | Build `volumeEvaluator.ts`: 3D grid evaluation (Y-major ordering) with progressive resolution | 4.2.* | ✅ |
| 4.9.2 | Build `voxelExtractor.ts`: surface voxel extraction with 6-face air-neighbor culling | 4.9.1 | ✅ |
| 4.9.3 | Build `materialResolver.ts`: depth-from-surface material assignment using SpaceAndDepth layer rules, PBR properties (roughness, metalness, emissive) for 50+ Hytale materials | 4.9.2 | ✅ |
| 4.9.4 | Build `voxelMeshBuilder.ts`: greedy meshing (axis-aligned slice processing, 2D mask merging) — 30-60% fewer triangles vs naive per-voxel | 4.9.3 | ✅ |
| 4.9.5 | Build `VoxelPreview3D.tsx`: React Three Fiber renderer with InstancedMesh per material, PBR `MeshStandardMaterial`, shadow support | 4.9.4 | ✅ |
| 4.9.6 | Build `FluidPlane.tsx`: unified water/lava shader — animated sine-wave water, emissive lava surface | 4.9.5 | ✅ |
| 4.9.7 | Build `EdgeOutlineEffect.ts`: custom depth-based Sobel edge detection post-processing shader | 4.9.5 | ✅ |
| 4.9.8 | SSAO support via `@react-three/postprocessing` | 4.9.5 | ✅ |
| 4.9.9 | Material legend overlay, wireframe toggle, fog/sky options | 4.9.5 | ✅ |

**Status:** Full voxel preview pipeline: density graph → 3D volume → surface extraction → material assignment → greedy meshing → PBR rendering. Progressive resolution (16³→32³→64³→128³) provides instant feedback. Greedy meshing reduces triangle count by 30-60%. PBR materials for 50+ Hytale block types with roughness/metalness/emissive properties. Post-processing effects (SSAO, edge outlines) are optional toggles.

**Acceptance:** Voxel terrain renders with correct materials, lighting, and shadows. Greedy meshing reduces draw calls. SSAO and edge outlines enhance visual quality without impacting 60fps. ✅

### Milestone 4.10: Bridge Integration + World Preview ✅

| Task | Description | Dependencies | Status |
|------|-------------|-------------|--------|
| 4.10.1 | Build `BridgeClient` (Rust): HTTP client for TerraNovaBridge with connection timeouts (3s connect, 8s default) | Phase 1 | ✅ |
| 4.10.2 | Build Rust types: `ServerStatus`, `ChunkDataRequest/Response`, `BlockPaletteResponse`, `TeleportRequest`, `ChunkRegenRequest` | 4.10.1 | ✅ |
| 4.10.3 | Build Tauri commands: `bridge_connect`, `bridge_disconnect`, `bridge_status`, `bridge_reload_worldgen`, `bridge_regenerate_chunks`, `bridge_teleport`, `bridge_player_info`, `bridge_fetch_palette`, `bridge_fetch_chunk`, `bridge_sync_file` | 4.10.2 | ✅ |
| 4.10.4 | Build `bridgeStore.ts`: connection state, block palette cache, dialog visibility | 4.10.3 | ✅ |
| 4.10.5 | Build `BridgeDialog.tsx`: connection config UI, server actions (reload, regen, teleport, sync), live status display | 4.10.4 | ✅ |
| 4.10.6 | Build `useBridge.ts` hook: IPC wrappers with error handling, `syncAndReload()` for hot-reload workflow | 4.10.4 | ✅ |
| 4.10.7 | StatusBar + Toolbar integration: bridge status indicator (green/amber/gray), Ctrl+B shortcut | 4.10.5 | ✅ |
| 4.10.8 | Build `blockColorMap.ts`: Hytale block name → render color mapping for 50+ block types | 4.10.3 | ✅ |
| 4.10.9 | Build `worldMeshBuilder.ts`: server chunk data → `VoxelMeshData[]` using heightmap-based surface extraction | 4.10.8, 4.9.4 | ✅ |
| 4.10.10 | Build `useWorldPreview.ts` hook: batched chunk loading, follow-player mode, cache key system, progress tracking | 4.10.9 | ✅ |
| 4.10.11 | World mode in `PreviewControls.tsx`: center coords, chunk radius (1-5), Y range, surface depth, lava level, follow player toggle | 4.10.10 | ✅ |
| 4.10.12 | On-demand chunk loading: `forceLoad` boolean threaded through Java→Rust→TypeScript, server uses `getNonTickingChunkAsync` with 15s timeout, tiered timeout hierarchy (server 15s < Rust 20s < frontend 25s) | 4.10.10 | ✅ |

**Status:** Full bridge integration between TerraNova (Tauri desktop app) and TerraNovaBridge (Hytale server plugin). Users can connect to a running Hytale server, browse live terrain, sync worldgen files for hot-reload, and visualize real server chunk data in the 3D voxel renderer. On-demand chunk generation enables previewing terrain without a nearby player.

**TerraNovaBridge Changes (companion Java project):**
- `ChunkDataHandler.java`: Tier 1 (`getChunkIfLoaded`) → Tier 2 (`getChunkIfInMemory`) → Tier 3 (`getNonTickingChunkAsync` with 15s timeout when `forceLoad=true`)
- `BlockPaletteHandler.java`: Returns block ID → name mapping from server registry
- `BridgeHttpServer.java`: 4-thread executor pool, registered new chunk/palette endpoints
- `TerraNovaBridgePlugin.java`: Masked auth token in startup logs

**Acceptance:** Connect to running Hytale server → fetch block palette → load chunks around player → render as 3D voxel terrain → sync edited worldgen file → hot-reload → see changes. On-demand chunk generation works for unloaded areas. ✅

### Milestone 4.8: Graph-Level Validation & Diagnostics

**Background:** Community feedback (Gap 5a — "Silent Failure"): users get no feedback when their graph has structural problems that would cause runtime issues (props not spawning, density outputs going nowhere, circular references). Field-level validation exists (Phase 1 constraints), but graph-level structural analysis does not.

| Task | Description | Dependencies |
|------|-------------|-------------|
| 4.8.1 | Define `GraphDiagnostic` interface: `{ nodeId: string, edgeId?: string, severity: "error" \| "warning" \| "info", code: string, message: string }` | Phase 2 |
| 4.8.2 | Build `validateGraph.ts`: pure function `(nodes: Node[], edges: Edge[]) → GraphDiagnostic[]` that runs all graph-level validation rules | 4.8.1 |
| 4.8.3 | Implement rule: **Disconnected required inputs** — for each node type, check that required input handles have incoming edges (e.g., Clamp requires an Input; Sum requires at least one input; CurveFunction requires both a Curve input and a Density input) | 4.8.2 |
| 4.8.4 | Implement rule: **Orphaned nodes** — nodes with no incoming OR outgoing edges (likely forgotten or accidentally disconnected); severity: warning | 4.8.2 |
| 4.8.5 | Implement rule: **Circular references** — detect cycles in the directed graph using DFS with back-edge detection; severity: error (Hytale's evaluator would infinite-loop or crash) | 4.8.2 |
| 4.8.6 | Implement rule: **Type mismatch on connections** — verify that edge source handle category matches target handle category (e.g., density output shouldn't connect to a curve input); severity: error | 4.8.2 |
| 4.8.7 | Implement rule: **Missing downstream consumers** — density nodes whose output goes nowhere (no outgoing edges and not an Exported node); severity: info ("this node's output is unused") | 4.8.2 |
| 4.8.8 | Implement rule: **Prop configuration completeness** — prop nodes should have: at least one PositionProvider input, at least one Scanner input, and either a Prefab path or material specification; severity: warning | 4.8.2 |
| 4.8.9 | Implement rule: **Assignment completeness** — assignment nodes should have at least one prop or material connected; severity: warning | 4.8.2 |
| 4.8.10 | Implement rule: **Scanner range sanity** — warn when ColumnLinear/ColumnRandom Range spans >512 blocks (likely a misconfiguration); warn when Area scanner Size has any axis >256 | 4.8.2 |
| 4.8.11 | Implement rule: **Duplicate ExportAs names** — multiple nodes exporting the same name would cause conflicts; severity: error | 4.8.2 |
| 4.8.12 | Implement rule: **Unresolved Imported references** — ImportedValue/Imported nodes whose Name doesn't match any ExportAs in the current asset pack; severity: warning (might be cross-file) | 4.8.2 |
| 4.8.13 | Build `graphValidationStore.ts`: Zustand store that holds `GraphDiagnostic[]`, re-runs validation on debounced graph changes (500ms after last node/edge change) | 4.8.2 |
| 4.8.14 | Build `DiagnosticsPanel.tsx`: collapsible panel (bottom of editor) showing all diagnostics grouped by severity, with click-to-navigate (clicking a diagnostic selects and zooms to the relevant node) | 4.8.13 |
| 4.8.15 | Integrate diagnostics into node rendering: nodes with errors get a red badge/icon overlay; nodes with warnings get a yellow badge; clicking the badge opens the diagnostics panel filtered to that node | 4.8.13, 2.1.4 |
| 4.8.16 | Integrate diagnostics into edge rendering: edges with type-mismatch errors render in red with a dashed pattern | 4.8.13 |
| 4.8.17 | StatusBar integration: show diagnostic summary count (e.g., "2 errors, 3 warnings") next to the save indicator; clicking opens the diagnostics panel | 4.8.13 |
| 4.8.18 | Build required-inputs registry: `REQUIRED_INPUTS: Record<string, string[]>` mapping node type names to the handle IDs that must have incoming connections (e.g., `{ "Clamp": ["Input"], "RangeChoice": ["Condition", "TrueInput", "FalseInput"] }`) | 4.8.3 |

**Technical Design Notes:**
- Validation runs in a Web Worker to avoid blocking the UI thread on large graphs (100+ nodes)
- The validation function is pure (no side effects) and operates on serialized node/edge arrays, making it easy to test
- Circular reference detection uses Kahn's algorithm (topological sort); if any nodes remain after removing all nodes with zero in-degree, those nodes are in a cycle
- Required-inputs registry (4.8.18) is separate from field constraints (Phase 1) — field constraints validate property values, required-inputs validates graph topology
- Cross-file import resolution (4.8.12) requires access to the full asset pack file list — the validation function accepts an optional `exportedNames: Set<string>` parameter built from all loaded files
- Diagnostics are keyed by `(nodeId, code)` to enable stable identity across re-validations (prevents UI flicker)

**Diagnostic Codes:**
| Code | Severity | Rule |
|------|----------|------|
| `DISCONNECTED_INPUT` | error | Required input handle has no incoming edge |
| `ORPHANED_NODE` | warning | Node has no edges at all |
| `CIRCULAR_REFERENCE` | error | Node is part of a cycle |
| `TYPE_MISMATCH` | error | Edge connects incompatible handle categories |
| `UNUSED_OUTPUT` | info | Non-export node's output goes nowhere |
| `INCOMPLETE_PROP` | warning | Prop node missing required position/scanner |
| `INCOMPLETE_ASSIGNMENT` | warning | Assignment node missing prop/material |
| `SCANNER_RANGE_EXTREME` | warning | Scanner range exceeds sane bounds |
| `DUPLICATE_EXPORT` | error | Multiple nodes share the same ExportAs name |
| `UNRESOLVED_IMPORT` | warning | Imported name not found in asset pack |

**Acceptance:** Graph diagnostics update within 1s of changes. Circular references detected and highlighted. Disconnected required inputs flagged. Click-to-navigate works from diagnostics panel. StatusBar shows counts. Performance: validation completes in <100ms for 200-node graphs.

---

## Phase 5: Template Marketplace

**Goal:** Community-driven template ecosystem with zero hosting cost.

**Deliverable:** Users can browse, download, and customize community templates.

### Milestone 5.1: Bundled Templates

| Task | Description | Dependencies |
|------|-------------|-------------|
| 5.1.1 | Build "Void" template: WorldStructure + one empty biome + minimal terrain (Constant density) | Phase 1 |
| 5.1.2 | Build "Flat Plains" template: simple terrain (Gradient + Clamp), grass/dirt/stone SpaceAndDepth layers | Phase 2 |
| 5.1.3 | Build "Forest" template: complex terrain (simplex noise + shapes), tree props (Cluster + Prefab), multiple materials | Phase 2 |
| 5.1.4 | Build "Desert" template: sand dune terrain (warped simplex), cacti props, mesa formations (shape primitives) | Phase 2 |
| 5.1.5 | Build "Floating Islands" template: 3D shapes (Ellipsoid, Cuboid), inverted gravity terrain | Phase 2 |
| 5.1.6 | Validate all templates against Hytale server | 5.1.1–5.1.5 |
| 5.1.7 | Generate preview thumbnails for each template | Phase 4 |

**Acceptance:** Each template loads on a Hytale server without errors and produces recognizable terrain.

### Milestone 5.2: Template Browser UI

| Task | Description | Dependencies |
|------|-------------|-------------|
| 5.2.1 | Build `TemplateBrowser.tsx`: grid of template cards | Phase 1 |
| 5.2.2 | Build `TemplateCard.tsx`: name, description, author, preview thumbnail, version badge | 5.2.1 |
| 5.2.3 | Build `TemplateDetail.tsx`: expanded view with full description, file list, download button | 5.2.2 |
| 5.2.4 | Category filtering and search | 5.2.1 |
| 5.2.5 | "Bundled" vs "Community" tabs | 5.2.1 |

**Acceptance:** Browser displays all bundled templates with thumbnails. Selecting a template shows details.

### Milestone 5.3: GitHub Template Infrastructure

| Task | Description | Dependencies |
|------|-------------|-------------|
| 5.3.1 | Create `HyperSystemsDev/terranova-templates` GitHub repo | None |
| 5.3.2 | Define template directory structure: `<name>/manifest.json` + `<name>/HytaleGenerator/` | 5.3.1 |
| 5.3.3 | Create `index.json` at repo root: list of all templates with metadata | 5.3.2 |
| 5.3.4 | Set up GitHub Pages to serve `index.json` | 5.3.3 |
| 5.3.5 | Create PR template for community template submissions | 5.3.1 |
| 5.3.6 | Create GitHub Actions workflow: validate submitted templates on PR | 5.3.1 |

**Acceptance:** `index.json` accessible via GitHub Pages URL. PR template guides contributors.

### Milestone 5.4: In-App Template Fetching

| Task | Description | Dependencies |
|------|-------------|-------------|
| 5.4.1 | Build `templateStore.ts`: Zustand store for template browsing state | 5.2.1 |
| 5.4.2 | Implement index fetch: GET `index.json` from GitHub Pages, parse, display | 5.4.1, 5.3.4 |
| 5.4.3 | Implement template download: fetch template files from GitHub, extract to user location | 5.4.2 |
| 5.4.4 | Progress indicator during download | 5.4.3 |
| 5.4.5 | Graceful offline fallback: show bundled templates only when offline | 5.4.2 |

**Acceptance:** Community templates appear in browser when online. Download creates a valid project directory. Offline shows bundled only.

### Milestone 5.5: Template Creation & Versioning

| Task | Description | Dependencies |
|------|-------------|-------------|
| 5.5.1 | Implement "Save as Template": export current project with metadata (name, description, author, serverVersion) | 5.3.2 |
| 5.5.2 | Generate `manifest.json` with all required fields | 5.5.1 |
| 5.5.3 | Provide link to PR submission workflow on GitHub | 5.5.1, 5.3.5 |
| 5.5.4 | Display version compatibility warnings in browser (template serverVersion vs current target) | 5.4.2 |

**Acceptance:** "Save as Template" produces a directory matching the `terranova-templates` format. Version warnings display for mismatched versions.

---

## Phase Dependencies

```
Phase 1 (App Shell + I/O)
  ├── 1.1 Scaffolding
  ├── 1.2 App Shell UI ← 1.1
  ├── 1.3 Rust Schema ← 1.1
  ├── 1.4 Asset Pack I/O ← 1.3
  ├── 1.5 Asset Tree + Property Panel ← 1.2, 1.4
  └── 1.6 New Project + Template ← 1.3, 1.4

Phase 2 (Node Graph) ← Phase 1
  ├── 2.1 React Flow Integration
  ├── 2.2 State + Sync ← 2.1
  ├── 2.3 Density Nodes (68) ← 2.1
  ├── 2.4 Other Nodes (130+) ← 2.1
  ├── 2.5 Node Palette ← 2.3, 2.4
  └── 2.6 Editor Features ← 2.2

Phase 3 (Sub-Editors) ← Phase 2
  ├── 3.1 Biome Range Editor ✅
  ├── 3.1b Biome Section Editor ✅
  ├── 3.2 Curve Editor ✅
  ├── 3.3 Material Layer Stack ✅
  ├── 3.4 Prop Placement Visualizer ✅
  ├── 3.5 Hytale Export Compatibility ✅
  └── 3.6 Settings Panel (can start in Phase 1)

Phase 4 (Preview) ← Phase 1, Phase 2 Graph State
  ├── 4.1 Noise Evaluation ✅
  ├── 4.2 Graph Evaluator ← 4.1 ✅
  ├── 4.3 Evaluation Pipeline ← 4.2 ✅
  ├── 4.4 2D Heatmap ← 4.3 ✅
  ├── 4.5 3D Mesh ← 4.3 ✅
  ├── 4.6 Preview Panel ← 4.4, 4.5 ✅
  ├── 4.7 Inline Node Thumbnails ← 4.3, 4.4 ✅
  ├── 4.9 Voxel Preview Engine ← 4.2, 4.5 ✅
  ├── 4.10 Bridge + World Preview ← 4.9 ✅
  └── 4.8 Graph-Level Validation ← Phase 2 (no preview dependency)

Phase 5 (Templates) ← Phase 1, Phase 2 (for complex templates)
  ├── 5.1 Bundled Templates ← Phase 2
  ├── 5.2 Template Browser UI ← Phase 1
  ├── 5.3 GitHub Infrastructure (independent)
  ├── 5.4 In-App Fetching ← 5.2, 5.3
  └── 5.5 Template Creation ← 5.2, 5.3
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | Push, PR | Lint (ESLint), Type check (tsc), Rust check (cargo check), Rust test (cargo test), Frontend test |
| `build.yml` | Push to main | Build Tauri app for macOS, Windows, Linux |
| `release.yml` | Git tag `v*` | Build + create GitHub Release with platform installers |
| `template-validate.yml` | PR to terranova-templates | Validate template JSON against schema |

### Build Matrix

| Platform | Target | Artifact |
|----------|--------|----------|
| macOS (Apple Silicon) | aarch64-apple-darwin | `.dmg` |
| macOS (Intel) | x86_64-apple-darwin | `.dmg` |
| Windows | x86_64-pc-windows-msvc | `.exe` / `.msi` |
| Linux | x86_64-unknown-linux-gnu | `.AppImage` / `.deb` |

---

## Risk Mitigation

| Risk | Phase | Mitigation |
|------|-------|-----------|
| V2 types change | All | Version-tagged schemas; each TerraNova release targets a specific Hytale version |
| React Flow performance at 60+ nodes | Phase 2 | React.memo all nodes, simplify CSS, test with real Hytale graphs |
| WebGL2 issues in Tauri webview | Phase 4 | 2D Canvas heatmap is primary; 3D mesh is progressive enhancement |
| fastnoise-lite doesn't match Hytale | Phase 4 | Document as approximate preview; focus on relative changes |
| Contributor recruitment for 200+ nodes | Phase 2 | Each node is independent — easy to parallelize; density nodes are highest priority |
| Inline thumbnail performance at scale | Phase 4.7 | Canvas pool + viewport culling + idle-frame scheduling; hard limit of 30 active canvases; disable toggle if perf degrades |
| Graph validation false positives | Phase 4.8 | Cross-file imports may flag valid references as unresolved; use warning severity (not error) for import checks; allow user dismiss |
| Force-load memory pressure | Phase 4.10 | `getNonTickingChunkAsync` loads chunks without ticking — lighter than full load; batch size capped at 4; 15s timeout prevents runaway generation |
| Bridge auth token exposure | Phase 4.10 | Token masked in server logs (first 4 chars only); bridge listens on 127.0.0.1 only; bearer auth on all endpoints |
| Greedy meshing edge cases | Phase 4.9 | Greedy rect merging validated with 165+ unit tests; falls back to per-face rendering if merging produces 0 faces |
| Template quality control | Phase 5 | Automated validation in CI; community review process via PR |

---

## Verification Criteria

| Phase | Test |
|-------|------|
| Phase 1 | Open Hytale default asset pack → edit biome terrain seed → save → load on server → world generates with new seed |
| Phase 2 | Import 60-node Flying Islands graph → all nodes render → auto-layout organizes → export matches original JSON |
| Phase 3 | Edit Manual curve → JSON output matches PointInOutAsset format exactly |
| Phase 4 | SimplexNoise2D → Normalizer → preview shows heightmap → adjust Scale → preview updates in <200ms |
| Phase 4.7 | Enable inline previews → density nodes show 64x64 thumbnails → change noise Frequency → thumbnail updates within 500ms → pan/zoom stays at 60fps |
| Phase 4.8 | Create Clamp node with no input → diagnostics panel shows "DISCONNECTED_INPUT" error → click diagnostic → zooms to node → connect input → error disappears within 1s |
| Phase 4.9 | Voxel mode → see 3D terrain with material layers → toggle SSAO/edge outline → visual quality improves → greedy meshing keeps 60fps |
| Phase 4.10 | Connect to bridge → load chunks → 3D terrain from live server → sync file → hot-reload → see terrain changes → enable "Generate Chunks" → unloaded terrain loads |
| Phase 5 | Browse templates → download "Forest" → customize props → export → loads on Hytale server |

---

*Document version 1.1 — February 10, 2026*
