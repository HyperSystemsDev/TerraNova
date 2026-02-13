# TerraNova — Brainstorming Notes

> Complete research dump: product vision, competitive analysis, tech stack rationale, V2 type inventory, user journey, naming decisions, and all findings from the design session.

---

## Table of Contents

- [Product Vision](#product-vision)
- [Naming Rationale](#naming-rationale)
- [Competitive Landscape](#competitive-landscape)
  - [Hytale Built-in V2 Editor](#hytale-built-in-v2-editor)
  - [HyPaint](#hypaint)
  - [WorldPainter (Minecraft)](#worldpainter-minecraft)
  - [World Machine / Gaea / Terragen](#world-machine--gaea--terragen)
  - [Positioning Matrix](#positioning-matrix)
- [Hytale V2 System Analysis](#hytale-v2-system-analysis)
  - [Architecture Overview](#architecture-overview)
  - [Complete Type Inventory](#complete-type-inventory)
  - [Field Analysis](#field-analysis)
  - [In-Game Editor Observations](#in-game-editor-observations)
- [Tech Stack Evaluation](#tech-stack-evaluation)
  - [App Shell: Tauri vs Electron](#app-shell-tauri-vs-electron)
  - [Node Graph: React Flow vs Alternatives](#node-graph-react-flow-vs-alternatives)
  - [Noise Engine: fastnoise-lite vs noise-rs](#noise-engine-fastnoise-lite-vs-noise-rs)
  - [3D Preview: Three.js / R3F](#3d-preview-threejs--r3f)
  - [State Management: Zustand](#state-management-zustand)
  - [Final Stack](#final-stack)
- [User Journey](#user-journey)
- [UI/UX Research](#uiux-research)
- [Architecture Challenges](#architecture-challenges)
- [Distribution Strategy](#distribution-strategy)
- [Open Questions & Decisions](#open-questions--decisions)

---

## Product Vision

**TerraNova is a standalone desktop design studio for Hytale's World Generation V2 system.**

Hytale's V2 worldgen is a 200+ type, fully data-driven procedural terrain system. It's powerful but complex. Server operators and modders who want custom worlds face three options today:

1. **Hytale's built-in editor** — requires a running game instance, gets chaotic at scale (wire crossings, no auto-layout), no offline capability
2. **Hand-write JSON** — viable for experts, error-prone, no visual feedback
3. **HyPaint** (upcoming) — cloud-based live service requiring internet + running server + installed mod

TerraNova fills the gap as the **offline-first design tool**: architect world generation offline, iterate fast with visual previews, share templates with the community — all without requiring Hytale to be running, an internet connection, or any mod installation.

### Three Pillars

1. **Enhanced Node Graph Editor** — React Flow with auto-layout, minimap, search, undo/redo, collapsible groups, inline documentation. Solves the wire-crossing chaos visible in Hytale's editor at 40+ nodes.

2. **Local Preview Engine** — Rust-powered noise evaluation producing 2D density heatmaps and 3D terrain meshes. See what your density graphs produce without running a server.

3. **Template Marketplace** — GitHub-hosted community templates. Browse, download, customize, contribute back. Zero infrastructure cost (all GitHub Pages + GitHub repos).

### Key Constraints

- **Open source** — MIT license, community trust
- **Zero profit** — no monetization, no ads, no telemetry
- **Zero infrastructure cost** — GitHub-only hosting (repos, Pages, Actions, Releases)
- **Desktop only** — Tauri app, no web deployment, no servers
- **Complementary** — designed to work alongside HyPaint and the in-game editor, not replace them

---

## Naming Rationale

**TerraNova** — Latin for "New Land"

- Directly evokes terrain generation (terra = land/earth)
- "Nova" implies innovation, newness — fitting for a new tool
- Memorable, unique, not easily confused with existing tools
- Works well as a single word or split: TerraNova, Terra Nova
- Domain/namespace friendly: `terranova`, `terra-nova`

Alternatives considered and rejected:
- **HyperTerrain** — too coupled to HyperSystems branding
- **WorldForge** — generic, potential trademark conflicts
- **BiomeStudio** — too narrow (covers more than just biomes)
- **NovaGen** — sounds like a corporation
- **TerraCraft** — too close to Minecraft/Terracotta associations

---

## Competitive Landscape

### Hytale Built-in V2 Editor

**Access:** Tab key → Content Creation in-game

**Strengths:**
- Covers all 200+ V2 asset types natively
- Color-coded node categories:
  - **Orange** — Material nodes
  - **Blue** — Runtime/density nodes
  - **Green** — Position provider nodes
  - **Pink** — Directionality nodes
  - **Teal** — Scanner nodes
- Direct integration with the running server
- Real-time preview (the actual world generates)
- No additional software needed

**Weaknesses:**
- **Requires game running** — can't design offline
- **No auto-layout** — wire crossings become unmanageable at 40+ nodes
- **No minimap** — easy to lose context in large graphs
- **No template system** — can't easily share configurations
- **No undo/redo** (unconfirmed, but typical for in-game editors)
- **No version control** — changes are immediate, no branching/experimentation
- **Performance tied to game** — designing while a server runs is resource-heavy

**Key Observation:** The in-game editor is functional but optimized for small-to-medium edits, not architectural design of complex world generation systems.

### HyPaint

**Status:** Private, launching soon (announced by HyperSystems)

**Model:** Live-service web UI with a sync mod

**Two modes:**
1. V2 node editing (similar to in-game editor)
2. Paint/Figma-style map editor (draw terrain directly)

**Strengths:**
- Real-time sync with running server
- Paint mode is unique — no other tool offers this
- Web-based, accessible from any browser

**Weaknesses:**
- **Requires internet** — cloud-dependent
- **Requires running server** — can't design standalone
- **Requires mod installation** — sync mod must be on the server
- **Proprietary** — if service dies, users lose access
- **Cloud costs** — they must pay for infrastructure
- **Vendor lock-in** — data lives on their servers

**Key Insight:** HyPaint is optimized for the **production phase** — fine-tuning terrain on a live server, painting maps directly. TerraNova is optimized for the **design phase** — architecting offline, iterating fast, building templates.

### WorldPainter (Minecraft)

**Relevance:** Closest existing analogy for what TerraNova aims to be

**Architecture:**
- Java-based desktop application
- Maven build system
- GPL v3 licensed
- Single developer maintained (Captain Chaos)
- Source files: 88-377 lines each

**Strengths:**
- Mature (10+ years)
- Large community
- Plugin ecosystem
- Comprehensive documentation

**Weaknesses:**
- Minecraft-specific — no Hytale support
- Old codebase, showing its age
- GPL license limits commercial integration

**Lessons for TerraNova:**
- Desktop terrain editor model is proven and popular
- Community templates/plugins create strong ecosystem flywheel
- Single-developer sustainability is possible but risky — open source helps

### World Machine / Gaea / Terragen

Professional terrain generation tools, evaluated for inspiration:

| Tool | Model | Price | Relevance |
|------|-------|-------|-----------|
| **World Machine** | Desktop, node graph | $99-$329 | Closest UX model (node-based terrain) |
| **Gaea** | Desktop, node graph | Free–$199 | Beautiful UI, modern design patterns |
| **Terragen** | Desktop, render-focused | $349-$849 | High-end, different market |

**Key takeaways:**
- Node-graph UIs for terrain are the industry standard
- Auto-layout and minimap are table stakes for serious tools
- Preview visualization is critical for usability
- These tools prove the market exists for standalone terrain editors

### Positioning Matrix

| | HyPaint | Hytale Editor | TerraNova |
|---|---|---|---|
| **Model** | Cloud live-service | In-game | Local desktop app |
| **Phase** | Production | Quick tweaks | Design |
| **Requires** | Internet + server + mod | Game running | Nothing |
| **Offline** | No | No | Yes |
| **Open source** | No | No | Yes (MIT) |
| **If service dies** | Lose access | Always works | Always works |
| **Templates** | Unknown | Vanilla biomes | Community marketplace |
| **Git-friendly** | Unknown | No | Yes |
| **Data ownership** | Their servers | Game files | Your local files |
| **Preview** | Real server | In-game live | Local approximate |
| **Auto-layout** | Unknown | No | Yes |
| **Cost** | Unknown | Free (with game) | Free |
| **Mod required** | Yes | No | No |

**Summary:** These tools are **complementary, not competitive**:
- TerraNova = **design** (architect offline, iterate fast, share templates)
- HyPaint = **production** (fine-tune on live server, paint terrain)
- Hytale Editor = **quick tweaks** (small in-game adjustments)

---

## Hytale V2 System Analysis

### Architecture Overview

Hytale's World Generation V2 is a fully data-driven, asset-based procedural terrain system:

- **Two-system architecture:** V1 (legacy zone-based) + V2 (asset-driven) run simultaneously
- **V1:** `World.json` + `Zones.json` + zone folders (mask-based biome placement)
- **V2:** `HytaleGenerator/` directory with JSON assets (noise-based biome placement)
- **170+ registered asset types** across 17 categories
- **Polymorphic type system:** JSON `"Type"` field dispatches to specific implementations
- **World height:** 0-319 (320 blocks)
- **Threading:** 75% of CPU cores in a thread pool
- **Chunk generation stages:** Tint → Environment → Blocks → Caves → Prefabs → Water
- **Zero PNG image fields** — the entire V2 system is JSON-based, not image-based

### Complete Type Inventory

**Total: 200+ types across 17+ categories**

#### 1. Density Functions — 68 types

The core of terrain generation. Every terrain shape is defined by a directed acyclic graph of density functions.

| Category | Types | Count |
|----------|-------|-------|
| **Noise Generators** | SimplexNoise2D, SimplexNoise3D, CellNoise2D, CellNoise3D | 4 |
| **Math Operations** | Constant, Sum, Multiplier, Abs, Inverter, Sqrt, Pow, OffsetConstant, AmplitudeConstant | 9 |
| **Clamping & Range** | Clamp, SmoothClamp, Floor, SmoothFloor, Ceiling, SmoothCeiling, Min, SmoothMin, Max, SmoothMax | 10 |
| **Mapping & Remapping** | Normalizer, CurveMapper, Offset, Amplitude | 4 |
| **Mixing & Blending** | Mix, MultiMix | 2 |
| **Coordinate Transforms** | Scale, Slider, Rotator, Anchor, XOverride, YOverride, ZOverride | 7 |
| **Warping** | GradientWarp, FastGradientWarp, VectorWarp | 3 |
| **Shape Primitives** | Distance, Cube, Ellipsoid, Cuboid, Cylinder, Plane, Axis, Shell, Angle | 9 |
| **Coordinate Accessors** | XValue, YValue, ZValue | 3 |
| **Context Accessors** | Terrain, BaseHeight, CellWallDistance, DistanceToBiomeEdge | 4 |
| **Gradient** | Gradient | 1 |
| **Caching** | Cache, Cache2D, YSampled | 3 |
| **Conditional** | Switch, SwitchState | 2 |
| **Positions-Based** | PositionsCellNoise, Positions3D, PositionsPinch, PositionsTwist | 4 |
| **Import/Export/Pipeline** | Exported, Imported, Pipeline | 3 |

**Common base fields (all density types):** `Inputs[]`, `Skip` (boolean), `ExportAs` (string)

#### 2. Curves — 19 types

Smooth parameter functions used by density shapes and material providers.

| Category | Types | Count |
|----------|-------|-------|
| **Primary** | Manual, Constant, DistanceExponential, DistanceS | 4 |
| **Arithmetic** | Multiplier, Sum, Inverter, Not | 4 |
| **Clamping** | Clamp, SmoothClamp, Floor, Ceiling, SmoothFloor, SmoothCeiling | 6 |
| **Min/Max** | Min, Max, SmoothMin, SmoothMax | 4 |
| **Reuse** | Imported | 1 |

**Key type — Manual:** Piecewise linear interpolation between control points (`Points: PointInOutAsset[]`). This is the primary user-editable curve type and needs a dedicated curve editor.

#### 3. Patterns — 15 types

Boolean pattern matchers for conditional placement.

| Category | Types | Count |
|----------|-------|-------|
| **Surface** | Floor, Ceiling, Wall, Surface, Gap | 5 |
| **Block** | BlockType, BlockSet | 2 |
| **Spatial** | Cuboid, Offset, FieldFunction | 3 |
| **Logic** | And, Or, Not, Constant | 4 |
| **Reuse** | Imported | 1 |

#### 4. Material Providers — 14 types

Determine which blocks are placed at each position.

| Category | Types | Count |
|----------|-------|-------|
| **Basic** | Constant, Solidity, Imported | 3 |
| **Depth-based** | DownwardDepth, DownwardSpace, UpwardDepth, UpwardSpace | 4 |
| **Horizontal** | SimpleHorizontal, Striped | 2 |
| **Density-driven** | FieldFunction, TerrainDensity | 2 |
| **Composition** | Queue, Weighted | 2 |
| **Advanced** | SpaceAndDepth | 1 |

**SpaceAndDepth sub-types (4 layer types):** ConstantThickness, NoiseThickness, RangeThickness, WeightedThickness

**SpaceAndDepth conditions (7 types):** AlwaysTrueCondition, AndCondition, OrCondition, NotCondition, EqualsCondition, GreaterThanCondition, SmallerThanCondition

#### 5. Position Providers — 14 types

Generate candidate coordinates for prop placement.

| Category | Types | Count |
|----------|-------|-------|
| **Static** | List | 1 |
| **Grid** | Mesh2D, Mesh3D | 2 |
| **Filtering** | FieldFunction, Occurrence | 2 |
| **Transformation** | Offset, Anchor, Bound | 3 |
| **Composition** | Union, SimpleHorizontal | 2 |
| **Performance** | Cache | 1 |
| **Terrain-aware** | BaseHeight | 1 |
| **Reference** | Framework, Imported | 2 |

**Point Generator (1 type):** Mesh — generates grid with Spacing, Jitter, Seed

#### 6. Props — 11 types

Object/structure placement.

| Category | Types | Count |
|----------|-------|-------|
| **Shape** | Box, Column, Cluster, Density | 4 |
| **Prefab** | Prefab, PondFiller | 2 |
| **Composition** | Queue, Union, Weighted | 3 |
| **Transformation** | Offset | 1 |
| **Reference** | Imported | 1 |

**Directionality (4 types):** Static, Random, Pattern, Imported

**PropRuntimeAsset — Biome Prop Placement Wrapper**

Each entry in a biome's `Props[]` array is a `PropRuntimeAsset` — a structural wrapper (no `Type` field) that combines position generation with prop assignment:

```
PropRuntimeAsset
├── Runtime: int (execution phase, default 0)
├── Skip: boolean
├── Positions: PositionProviderAsset (generates XZ candidates)
│   e.g., Mesh2D, FieldFunction, DensityBased
└── Assignments: AssignmentAsset (selects which prop to place)
    e.g., Constant → Prop: Prefab { Directionality, Scanner, Pattern, BlockMask }
         Weighted → WeightedAssignments[] → { Weight, Assignments: Constant → Prop }
```

The Prop's Scanner, Directionality, Pattern, and BlockMask are nested **inside** the Prop object within the Assignment chain — not at the PropRuntimeAsset level. This was confirmed from analysis of working Hytale biome files (2026.02).

> **Editor implication:** When a biome file is opened in TerraNova, only the `Terrain` subtree is loaded into the graph editor. Props entries remain in `originalWrapper` as static JSON.

#### 7. Scanners — 5 types

Determine vertical (Y-axis) positions for prop placement.

| Type | Description |
|------|-------------|
| Origin | Single point, no scanning |
| ColumnLinear | Top-down or bottom-up Y scan |
| ColumnRandom | Random Y sampling (DART_THROW or PICK_VALID) |
| Area | 2D area scan (CIRCLE or SQUARE) with child scanner |
| Imported | Reference to exported scanner |

#### 8. Assignments — 5 types

Prop distribution strategies.

| Type | Description |
|------|-------------|
| Constant | Always returns the same prop |
| FieldFunction | Density-driven prop selection via ranges |
| Sandwich | Y-range-based prop selection |
| Weighted | Weighted random with skip chance |
| Imported | Reference to exported assignment |

#### 9. Vector Providers — 5 types

Generate 3D vectors for warping and directional operations.

| Type | Description |
|------|-------------|
| Constant | Fixed vector value |
| DensityGradient | Computed gradient of a density function |
| Cache | Cached vector provider |
| Exported | Marks for export with optional single-instance sharing |
| Imported | Reference to exported vector provider |

#### 10. Environment & Tint Providers — 4 types

| Category | Types |
|----------|-------|
| Environment Providers | Constant, DensityDelimited |
| Tint Providers | Constant, DensityDelimited |

#### 11. Supporting Systems

| System | Types/Concepts |
|--------|---------------|
| **Block Masks** | BlockMaskAsset, BlockMaskEntryAsset, 11 prefab filter types |
| **Framework** | DecimalConstants, Positions (2 types) |
| **World Structure** | NoiseRange (BasicWorldStructureAsset) — root of V2 |
| **Settings** | SettingsAsset (CustomConcurrency, BufferCapacityFactor, etc.) |
| **World.json** | V1 root config (Width, Height, Masks, Randomizer) |
| **Zones.json** | V1 zone mapping (GridGenerator, MaskMapping) |
| **File System** | FileIO, FileIOSystem, AssetFileSystem (layered resolution) |

### Field Analysis

Across all 200+ types:

| Field Category | Count | Examples |
|----------------|-------|---------|
| **Slider-editable numbers** | ~120 | Scale, Lacunarity, Persistence, Jitter, WallA, WallB, Range, Thickness |
| **Cross-reference fields** | 70+ | DensityAsset, CurveAsset, MaterialProviderAsset, PatternAsset, ScannerAsset |
| **Enum/dropdown fields** | 15+ | ReturnType, LayerContextType, ConditionParameter, ScanShape, MoldingDirection |
| **String fields** | 50+ | Seed, Name, ExportAs, BaseHeightName, Environment |
| **Boolean fields** | 20+ | Skip, Reversed, TopDownOrder, RelativeToPosition, RequireAllDirections |
| **Vector fields** | 15+ | Vector3d (Axis, NewYAxis, Scale), Vector3i (Range, Min, Max, Offset) |
| **Array fields** | 30+ | Inputs[], Points[], Delimiters[], Layers[], WeightedMaterials[] |
| **PNG/image fields** | 0 | Entire V2 system is JSON-based |

### In-Game Editor Observations

From analysis of Hytale's in-game editor (Tab → Content Creation):

**Layout:**
- Left panel: asset tree browser
- Center: node graph canvas
- Right panel: property editor (sliders, dropdowns, text fields)
- Color-coded nodes by category

**Pain Points at Scale:**
- Wire crossings become unmanageable at 40+ nodes
- No auto-layout algorithm
- No minimap for navigation
- No node search/filtering
- No collapsible groups
- No keyboard shortcuts for common operations
- No template system for sharing configurations

**What Works Well:**
- Color coding is intuitive and transfers knowledge
- Property panel with sliders is effective for numeric fields
- Direct connection to running server enables real-time preview

---

## Tech Stack Evaluation

### App Shell: Tauri vs Electron

| Factor | Tauri v2 | Electron |
|--------|----------|----------|
| **Bundle size** | ~10MB | ~150-200MB |
| **RAM usage** | Lower (system webview) | Higher (bundled Chromium) |
| **Backend** | Rust (native) | Node.js |
| **IPC performance** | Fast (Rust ↔ WebView, binary transfer) | Moderate (Node ↔ Chromium) |
| **File system** | Native Rust access | Node.js fs module |
| **Noise evaluation** | Native Rust (fastnoise-lite, near-C++) | WASM or native addon (extra complexity) |
| **Cross-platform** | macOS (WKWebView), Windows (WebView2), Linux (WebKitGTK) | Consistent Chromium everywhere |
| **Maturity** | v2 stable (2025) | Very mature (10+ years) |
| **Community** | Growing fast | Massive |

**Decision: Tauri v2**
- ~15x smaller bundle matters for a zero-cost distribution model
- Rust backend is essential for the preview engine (noise evaluation)
- IPC binary transfer for Float32Array preview data is a core requirement
- v2 is production-ready as of 2025

**Risk:** WebView rendering differences across platforms. Mitigated by targeting well-tested libraries (React Flow, Three.js).

### Node Graph: React Flow vs Alternatives

| Library | License | Custom Nodes | Performance | React Compatible |
|---------|---------|-------------|-------------|-----------------|
| **React Flow (@xyflow/react)** | MIT (free for open source) | Yes, full control | Good (handles 100+ nodes with memo) | React 19 compatible |
| **rete.js** | MIT | Yes | Moderate | Framework-agnostic |
| **Litegraph.js** | MIT | Yes | Good (Canvas-based) | No React integration |
| **@antv/x6** | MIT | Yes | Good | React wrapper available |

**Decision: React Flow v12 (@xyflow/react)**
- MIT licensed, free for open-source projects
- Built-in: minimap, controls, dark mode (`colorMode="dark"`), node selection
- Custom node components with full React control
- Handles 68+ custom density node types
- Active maintenance, strong community
- Compatible with React 19

### Noise Engine: fastnoise-lite vs noise-rs

| Library | Language | Performance | Algorithms | Maintenance |
|---------|----------|-------------|------------|-------------|
| **fastnoise-lite** | Rust (crate) | Near-C++ | Simplex, Cell, Perlin, Value | Active, MIT |
| **noise-rs** | Rust (crate) | Good | Perlin, Simplex, OpenSimplex | Less active |
| **FastNoiseLite** | C++/C# (original) | C++ speed | All standard algorithms | Active, MIT |

**Decision: fastnoise-lite (Rust crate)**
- Covers all noise types Hytale uses (Simplex 2D/3D, Cell 2D/3D)
- Near-C++ performance for native-speed preview evaluation
- MIT licensed
- Direct Rust integration with serde for JSON interop

**Note:** Preview will be approximate — fastnoise-lite may not exactly match Hytale's internal noise implementation. Document as "approximate preview" focused on relative changes.

### 3D Preview: Three.js / R3F

| Technology | Approach | Compatibility |
|------------|----------|---------------|
| **Three.js + React Three Fiber** | WebGL in Tauri's webview | R3F 9.5.0 supports React 19 |
| **Raw WebGL** | Direct WebGL2 calls | Full control but more work |
| **WebGPU** | Next-gen GPU API | Not yet universally supported |

**Decision: Three.js + React Three Fiber (R3F)**
- PlaneGeometry with vertex Y displacement from density values
- OrbitControls for camera
- R3F 9.5.0 is React 19 compatible
- Auto-tracks Three.js version (r175+)

**WebGL Caution:** WebGL2 has had reported issues in Tauri webviews (GitHub issue #2866). Modern webviews support it, but plan **2D Canvas heatmap first**, 3D mesh as progressive enhancement.

### State Management: Zustand

**Why Zustand over Redux/Context/Jotai:**
- Lightweight (~1KB), minimal boilerplate
- Works naturally with React Flow's state model
- Easy to create multiple stores (editor, project, preview, templates)
- Good TypeScript support
- No provider wrapping needed

### Final Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| App Shell | Tauri v2 | 2.0+ stable |
| Frontend | React + TypeScript | 19.x |
| Node Graph | @xyflow/react | 12.10.0 |
| State | Zustand | latest |
| 3D Preview | @react-three/fiber + three | 9.5.0 / r175+ |
| 2D Preview | HTML Canvas | Native |
| Layout | @dagrejs/dagre | 2.0.3 |
| Layout (alt) | elkjs | 0.11.0 |
| Styling | Tailwind CSS | latest |
| Build | pnpm + Vite | latest |
| Rust: Noise | fastnoise-lite | latest (crates.io) |
| Rust: JSON | serde + serde_json | latest |

---

## User Journey

### First-Time User

1. **Download** TerraNova from GitHub Releases (~10MB installer)
2. **Install** — native installer for their platform (macOS .dmg, Windows .exe, Linux .AppImage)
3. **Launch** — dark-themed welcome screen
4. **New Project wizard:**
   - "What kind of world?" → Forest / Desert / Mountains / Floating Islands / Custom
   - Selecting a template creates a pre-configured asset pack directory
5. **Explore** the asset tree sidebar — see the template's file structure
6. **Click** a density file → node graph opens in the main canvas
7. **Adjust** sliders in the property panel → preview updates (2D heatmap first, then 3D mesh)
8. **Add nodes** from the palette → drag connections → auto-layout organizes the graph
9. **Save** → valid V2 JSON files on disk
10. **Copy** the asset pack to Hytale's mods directory → test in-game

### Returning User

1. **Open** existing project (File → Open Asset Pack)
2. **Browse** community templates in the Template Browser
3. **Download** a template → customize it → save as new template
4. **Submit** template via PR to `terranova-templates` repo
5. **Share** with the community via Discord

### Power User

1. **Import** complex 60-node density graph from existing Hytale asset pack
2. **Auto-layout** the graph → clean, organized visualization
3. **Use** specialized sub-editors (curve editor, biome range editor, material layer stack)
4. **Compare** biomes side-by-side in the preview panel
5. **Git** the project for version control — clean JSON diffs
6. **Contribute** node type implementations to TerraNova's open-source codebase

---

## UI/UX Research

### Design Principles

1. **Dark theme by default** — Hytale's editor is dark, professional terrain tools are dark, users expect it
2. **Progressive disclosure** — don't dump 200+ types at once. World Structure → Biomes → Terrain → Materials → Props. Each level shows only what's relevant.
3. **Guided workflow, not blank canvas** — every new project starts from a template, not an empty graph
4. **Inline documentation** — every node type and field has a tooltip sourced from our 19 worldgen docs
5. **Visual hierarchy** — color-coded nodes matching Hytale's scheme (knowledge transfers between tools)
6. **Non-destructive** — undo/redo everything, auto-save drafts, never lose work

### Panel Layout

```
┌──────────┬────────────────────────────┬──────────────┐
│  Asset   │                            │  Properties  │
│  Tree    │     Node Graph Canvas      │    Panel     │
│          │                            │              │
│  - Biomes│   [Node] ── [Node]         │  Scale: ──── │
│  - Density│       \── [Node]          │  Seed:  ____ │
│  - Props │            └── [Node]      │  Octaves: 3  │
│          │                            │              │
│          ├────────────────────────────┤              │
│          │  Preview Panel (toggle)    │              │
│          │  [2D Heatmap] [3D Mesh]    │              │
└──────────┴────────────────────────────┴──────────────┘
│                    Status Bar                         │
└───────────────────────────────────────────────────────┘
```

### Color Scheme (Matching Hytale)

| Category | Color | Hex |
|----------|-------|-----|
| Material nodes | Orange | #FF8C00 |
| Runtime/Density nodes | Blue | #4A90D9 |
| Position provider nodes | Green | #4CAF50 |
| Directionality nodes | Pink | #E91E63 |
| Scanner nodes | Teal | #00BCD4 |
| Curve nodes | Purple | #9C27B0 |
| Pattern nodes | Yellow | #FFC107 |
| Math/utility nodes | Gray | #9E9E9E |

---

## Architecture Challenges

### 1. Representing 200+ types without overwhelming users

**Problem:** 200+ types is a lot. Non-programmer modders need progressive disclosure.

**Solution:** Multi-level navigation:
- **Level 1:** World Structure (root) — only shows biome ranges
- **Level 2:** Biome — shows terrain, materials, props, environment, tint
- **Level 3:** Density graph — the full node graph for a single subsystem
- **Level 4:** Specialized editors — curve editor, material layer stack, etc.

Node palette is categorized and searchable. Only relevant types shown in context (e.g., when editing a density graph, only density types appear in the palette).

### 2. Validating JSON output

**Problem:** V2 JSON has strict schema requirements. Invalid JSON crashes the server.

**Solution:** Dual validation:
- **Frontend (TypeScript):** Immediate inline errors (red borders, error tooltips)
- **Backend (Rust):** Full structural validation before save (missing fields, type mismatches, circular references)
- Schema defined once, derived for both sides

### 3. Deep nesting

**Problem:** Biome → Terrain → Density → Density → Density... can nest 10+ levels deep.

**Solution:**
- Node graph flattens the hierarchy visually
- Collapsible groups hide complexity
- Export/Import system (same as Hytale's) enables reusable sub-graphs
- Breadcrumb navigation for drilling into nested assets

### 4. Density graph performance with 68 types

**Problem:** Large graphs (60+ nodes) in React Flow need optimization.

**Solution:**
- `React.memo` on all custom node components
- Simplify CSS (avoid shadows/gradients on nodes)
- React Flow's built-in virtualization for off-screen nodes
- Consider Canvas-based rendering fallback for very large graphs

### 5. Rust ↔ React IPC for preview

**Problem:** Preview needs fast binary data transfer (NxN float arrays).

**Solution:** Tauri v2 Raw Requests for binary data transfer (Float32Array). Debounced at 100ms to prevent flood. Target <200ms update latency for slider-to-preview pipeline.

### 6. Template packaging

**Problem:** Templates need to be complete, valid, and versioned.

**Solution:**
- Each template is a directory with `manifest.json` (metadata) + full asset pack
- `index.json` at repo root lists all templates
- GitHub Pages serves the index
- Template versioning tracks which Hytale server version it targets

---

## Distribution Strategy

| Need | Solution | Cost |
|------|----------|------|
| App hosting | GitHub Releases (per-platform installers) | Free |
| Template index | GitHub Pages static site | Free |
| Template storage | `HyperSystemsDev/terranova-templates` repo | Free |
| Documentation | GitHub Pages | Free |
| Community | Existing Discord server | Free |
| CI/CD | GitHub Actions (build + release) | Free for open-source |
| Update notifications | Tauri updater (checks GitHub Releases) | Free |

**Total: $0/month**

---

## Open Questions & Decisions

### Resolved

1. **Name:** TerraNova
2. **License:** MIT (community trust, no restrictions)
3. **App shell:** Tauri v2 (small bundle, Rust backend, native file system)
4. **Node graph:** React Flow v12 (MIT, free for open source)
5. **Preview approach:** 2D heatmap first (Canvas), 3D mesh as enhancement (Three.js/R3F)
6. **Distribution:** GitHub-only, zero cost
7. **Noise library:** fastnoise-lite (Rust, near-C++ performance)

### Open

1. **dagre vs elkjs for auto-layout?** — dagre is simpler, elkjs supports hierarchical layouts with ports. Could start with dagre, upgrade to elkjs if needed.
2. **How to handle V1 (legacy zone system)?** — V2-first, V1 support could come later as an extension. V1 is mask-based (PNG images + zone JSON), fundamentally different from V2's node graph.
3. **Template contribution workflow** — PR-based on GitHub is the plan, but should there be a review process? Community moderators?
4. **Localization** — English-first, but should the UI be i18n-ready from the start?
5. **Plugin system** — Should TerraNova support plugins/extensions for custom node types? Potentially useful when Hytale adds new V2 types.
6. **Accessibility** — keyboard navigation, screen reader support, color-blind friendly node colors. Important but scope needs to be defined.

---

*Document compiled from design session, February 2026. Source: hytale-server-docs worldgen documentation (19 docs), Hytale server pre-release 2026.02.05-9ce2783f7.*
