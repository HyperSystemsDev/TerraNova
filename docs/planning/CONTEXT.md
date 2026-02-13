# TerraNova — Context, References & Tech Compatibility

**Version:** 1.0
**Date:** 2026-02-06
**Organization:** HyperSystemsDev

---

## Table of Contents

- [Worldgen Documentation References](#worldgen-documentation-references)
- [Tech Stack Versions & Compatibility](#tech-stack-versions--compatibility)
- [Known Issues](#known-issues)
- [Architecture Decision Records](#architecture-decision-records)
- [Setup Instructions for Contributors](#setup-instructions-for-contributors)
- [Project Links](#project-links)

---

## Worldgen Documentation References

All V2 worldgen documentation lives in `hytale-server-docs/docs/worldgen/`. These 19 files are the schema source of truth for TerraNova.

**Source:** Decompiled from Hytale server pre-release `2026.02.05-9ce2783f7`

| # | Document | Types Defined | Relevance to TerraNova |
|---|----------|---------------|----------------------|
| 1 | `WORLDGEN_OVERVIEW.md` | System architecture, 170+ type registry | Understanding the full system; type count verification |
| 2 | `WORLD_STRUCTURE.md` | NoiseRange (BasicWorldStructureAsset), BiomeRangeAsset | Root of V2 — the starting point for every asset pack |
| 3 | `BIOMES.md` | BiomeAsset, DAOTerrain, PropRuntimeAsset | Core building block — terrain, materials, props, environment, tint |
| 4 | `DENSITY_FUNCTIONS.md` | 68 density function types | **Highest priority** — core of terrain generation, node graph editor |
| 5 | `CURVES.md` | 19 curve types | Curve editor; used by density shapes and material providers |
| 6 | `PATTERNS.md` | 15 pattern types | Conditional placement; used by props and materials |
| 7 | `MATERIAL_PROVIDERS.md` | 14 material types + 4 layers + 7 conditions | Block material selection; material layer stack editor |
| 8 | `POSITION_PROVIDERS.md` | 14 position types + 1 point generator | Prop placement coordinates; prop visualizer |
| 9 | `PROPS.md` | 11 prop types + 4 directionality | Object/structure placement |
| 10 | `SCANNERS.md` | 5 scanner types | Vertical position scanning for props |
| 11 | `ASSIGNMENTS.md` | 5 assignment types | Prop distribution strategies |
| 12 | `VECTOR_PROVIDERS.md` | 5 vector provider types | 3D vectors for warping and directional ops |
| 13 | `ENVIRONMENT_TINT.md` | 2 environment + 2 tint providers | Atmospheric effects and color tinting |
| 14 | `BLOCK_MASKS.md` | BlockMaskAsset, 11 prefab filter types | Block placement/replacement control |
| 15 | `FRAMEWORK.md` | DecimalConstants, Positions (2 types) | Shared named constants and position providers |
| 16 | `SETTINGS.md` | SettingsAsset | Performance tuning (concurrency, buffers, view distance) |
| 17 | `FILE_SYSTEM.md` | FileIO, AssetFileSystem, AssetPath | Asset resolution and mod overlay system |
| 18 | `WORLD_JSON.md` | World.json config | V1 legacy root configuration |
| 19 | `ZONES_V1.md` | Zone system, ZoneDiscoveryConfig | V1 legacy biome-grouping system |

### Document Priority for Implementation

**Phase 1 (must read):** #1 (Overview), #2 (World Structure), #3 (Biomes), #16 (Settings), #17 (File System)

**Phase 2 (must read):** #4 (Density — 68 types), #5 (Curves — 19), #6 (Patterns — 15), #7 (Materials — 14), #8 (Positions — 14), #9 (Props — 11), #10 (Scanners — 5), #11 (Assignments — 5), #12 (Vectors — 5), #13 (Env/Tint — 4), #14 (Block Masks), #15 (Framework)

**Later (V1 support):** #18 (World.json), #19 (Zones V1)

---

## Tech Stack Versions & Compatibility

All versions verified as of **February 6, 2026**.

### Core Stack

| Technology | Package | Version | Notes |
|------------|---------|---------|-------|
| **Tauri** | `@tauri-apps/cli` | 2.0+ (stable) | Tauri v2 went stable in 2025. Cross-platform: macOS 12+ (WKWebView), Windows 10+ (WebView2), Linux (WebKitGTK). |
| **React** | `react` | 19.x | Required by React Flow 12 and R3F 9. |
| **TypeScript** | `typescript` | 5.x | Strict mode recommended. |
| **Vite** | `vite` | 6.x | Fast dev server, good Tauri integration via `@tauri-apps/vite-plugin`. |
| **pnpm** | `pnpm` | 9.x | Workspace-friendly, fast installs. |

### Frontend Libraries

| Library | Package | Version | License | Compatibility Notes |
|---------|---------|---------|---------|-------------------|
| **React Flow** | `@xyflow/react` | 12.10.0 | MIT | Free for open-source. Built-in dark mode via `colorMode="dark"`. Supports React 19. |
| **React Three Fiber** | `@react-three/fiber` | 9.5.0 | MIT | React 19.2 compatible. Auto-tracks Three.js version. |
| **Three.js** | `three` | r175+ | MIT | WebGL2 default. WebGPU support expanding but not relied upon. |
| **Drei** | `@react-three/drei` | latest | MIT | OrbitControls, helpers. Matches R3F version. |
| **Zustand** | `zustand` | latest | MIT | Lightweight state. No breaking changes expected. |
| **Dagre** | `@dagrejs/dagre` | 2.0.3 | MIT | Active maintenance (last updated Feb 2026). Directed graph layout. |
| **ELK** | `elkjs` | 0.11.0 | EPL-2.0 | Advanced hierarchical layouts. Alternative to dagre if needed. Note: EPL-2.0 is compatible with MIT projects but more restrictive for redistribution — evaluate if bundled. |
| **Tailwind CSS** | `tailwindcss` | 4.x | MIT | Utility-first styling. v4 uses Oxide engine (faster). |

### Rust Dependencies

| Crate | Version | License | Purpose |
|-------|---------|---------|---------|
| **tauri** | 2.x | MIT/Apache-2.0 | App shell, IPC, file system |
| **serde** | latest | MIT/Apache-2.0 | Serialization framework |
| **serde_json** | latest | MIT/Apache-2.0 | JSON parsing/writing |
| **fastnoise-lite** | latest (crates.io) | MIT | Noise generation (Simplex, Cell, Perlin, Value) |

### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 22.x LTS | Frontend tooling (pnpm, Vite) |
| **Rust** | stable (latest) | Backend compilation |
| **pnpm** | 9.x | Package management |

### Compatibility Matrix

| Component | macOS 12+ | Windows 10+ | Linux (Ubuntu 22.04+) |
|-----------|-----------|-------------|----------------------|
| Tauri v2 | WKWebView | WebView2 | WebKitGTK |
| React Flow | ✅ | ✅ | ✅ |
| Three.js (WebGL2) | ✅ | ✅ | ⚠️ (see known issues) |
| Canvas 2D | ✅ | ✅ | ✅ |
| File system | ✅ | ✅ | ✅ |
| Tauri updater | ✅ | ✅ | ✅ (AppImage) |

---

## Known Issues

### KI-1: WebGL2 in Tauri Webviews

**Severity:** Medium
**Affects:** 3D terrain preview (Phase 4)
**Platforms:** Primarily Linux (WebKitGTK), some macOS/Windows edge cases

**Description:** WebGL2 has had reported rendering issues in Tauri's webview component. GitHub issue [tauri-apps/tauri#2866](https://github.com/tauri-apps/tauri/issues/2866) tracks WebGL-related problems. Modern webview versions generally support WebGL2, but older system webviews may not.

**Mitigation:**
1. 2D Canvas heatmap preview is the primary preview mode (Phase 4, Milestone 4.4)
2. 3D mesh preview is a progressive enhancement (Phase 4, Milestone 4.5)
3. Feature detection: check WebGL2 availability at runtime, disable 3D if unavailable
4. Document minimum webview versions in system requirements

**Status:** Open — will be validated during Phase 4 development.

### KI-2: fastnoise-lite vs Hytale's Noise Implementation

**Severity:** Low
**Affects:** Preview accuracy (Phase 4)

**Description:** fastnoise-lite is an independent noise library. Hytale's internal noise implementation may differ in subtle ways (different simplex gradient tables, different cell noise distance functions, etc.). Preview output may not match actual Hytale generation pixel-for-pixel.

**Mitigation:**
1. Document all previews as "approximate" — focused on relative changes, not absolute accuracy
2. If Hytale's noise implementation details become available, can adjust
3. Users can always verify by loading on an actual Hytale server

**Status:** Accepted risk. By design, TerraNova is a design tool, not a pixel-perfect emulator.

### KI-3: React Flow Performance at Large Graph Scale

**Severity:** Low-Medium
**Affects:** Node graph editor (Phase 2)

**Description:** React Flow renders nodes as DOM elements. At 60+ nodes with complex custom components, rendering may degrade. Hytale's Flying Islands example has approximately 60 nodes.

**Mitigation:**
1. `React.memo()` on all custom node components
2. Minimize CSS complexity on nodes (avoid shadows, gradients, blur)
3. Use React Flow's built-in node virtualization for off-screen nodes
4. Performance test with 100-node graphs during Phase 2 development
5. If DOM rendering becomes a bottleneck, consider hybrid rendering (Canvas for wires, DOM for nodes)

**Status:** Open — will be validated during Phase 2 development.

### KI-4: ELK.js License (EPL-2.0)

**Severity:** Low
**Affects:** Auto-layout (Phase 2)

**Description:** `elkjs` uses the Eclipse Public License 2.0, which is more restrictive than MIT. While EPL-2.0 is compatible with MIT projects (you can use EPL libraries in an MIT project), the EPL code itself must remain under EPL if modified.

**Mitigation:**
1. Primary auto-layout uses `@dagrejs/dagre` (MIT licensed)
2. ELK.js is listed as an alternative for advanced hierarchical layouts
3. If ELK is used, it's included as a dependency (not modified), which is permitted under EPL-2.0
4. Document the license distinction in the project's NOTICE file

**Status:** Resolved — dagre is the primary choice; elkjs is optional.

### KI-5: Hytale-Native vs TerraNova V2 Field Naming

**Severity:** Medium
**Affects:** Import/export of biome files from Hytale's in-game editor

**Description:** TerraNova's V2 abstraction layer (defined in `src/schema/defaults.ts`) uses different field names and conventions than Hytale's native in-game editor format. Key differences discovered from analysis of working biome files:

- **Noise parameters:** Hytale uses `Scale`/`Persistence`, TerraNova uses `Frequency`/`Gain`
- **Child inputs:** Hytale always uses `Inputs[]` arrays, TerraNova uses named handles (`Input`, `InputA`, `InputB`, `Condition`, etc.)
- **Type names:** Hytale's `Multiplier`/`Inverter`/`CurveMapper` map to TerraNova's `Product`/`Negate`/`CurveFunction`
- **Node metadata:** Hytale embeds `$NodeId` UUIDs and `$NodeEditorMetadata` (positions, groups, comments); TerraNova does not use these
- **Material references:** Hytale uses `{ Solid: "Block_Name" }` objects; TerraNova uses plain `"material_name"` strings
- **Curve points:** Hytale uses `[{ In: number, Out: number }]` objects; TerraNova uses `[[x, y]]` array pairs

**Mitigation:**
1. Templates use TerraNova's own field naming conventions for editor compatibility
2. A future import/export translation layer will be needed for interoperability with Hytale's in-game editor
3. The `src-tauri/src/schema/biome.rs` Rust struct already handles the structural format (`PropRuntimeAsset` with `Positions`/`Assignments`)

**Status:** Open — documented for future import/export feature planning.

---

## Architecture Decision Records

### ADR-1: Tauri over Electron

**Context:** TerraNova needs a desktop app shell with native file system access, a Rust backend for noise evaluation, and cross-platform support.

**Decision:** Tauri v2

**Rationale:**
- **Bundle size:** ~10MB vs Electron's ~150-200MB. Critical for a zero-cost distribution model.
- **Rust backend:** Native-speed noise evaluation is a core requirement for the preview engine. Tauri's Rust backend provides this natively without WASM overhead.
- **IPC performance:** Tauri v2's Raw Requests enable binary data transfer (Float32Array) for preview data, critical for <200ms latency.
- **Memory:** Lower RAM usage than Electron (uses system webview, not bundled Chromium).
- **Production-ready:** Tauri v2 went stable in 2025 with active community.

**Consequences:**
- Platform webview differences (WKWebView vs WebView2 vs WebKitGTK) — mitigated by testing on all platforms
- Smaller ecosystem than Electron — mitigated by Tauri's growing community
- WebGL2 support varies by webview — mitigated by 2D Canvas as primary preview

### ADR-2: React Flow over Alternatives

**Context:** TerraNova needs a node graph library for 200+ custom node types, with minimap, dark mode, and good React integration.

**Decision:** React Flow v12 (`@xyflow/react`)

**Alternatives considered:**
- **rete.js** — Framework-agnostic, would require more integration work with React
- **Litegraph.js** — Canvas-based (better performance) but no native React integration
- **@antv/x6** — Good library but React wrapper is a secondary concern
- **Custom implementation** — Too much development effort

**Rationale:**
- MIT licensed, free for open-source projects
- Built-in: minimap, controls, dark mode, node selection, zoom/pan
- Custom node components with full React control (important for 200+ node types)
- React 19 compatible (v12.10.0)
- Strong ecosystem, active maintenance, good documentation
- Handles 100+ node graphs with proper optimization (React.memo)

**Consequences:**
- DOM-based rendering may limit performance at very large scales (100+ nodes) — mitigated by memoization and virtualization
- Tied to React ecosystem — acceptable since React is the frontend framework

### ADR-3: fastnoise-lite over noise-rs

**Context:** TerraNova needs a Rust noise library for real-time preview evaluation of Hytale's density functions.

**Decision:** fastnoise-lite (Rust crate)

**Alternatives considered:**
- **noise-rs** — Rust noise library, less actively maintained, doesn't cover all Hytale noise types
- **WASM-compiled FastNoiseLite** — C++ original compiled to WASM, loses native Rust performance
- **Custom implementation** — Too much effort, likely less performant

**Rationale:**
- Covers all noise types Hytale uses: Simplex 2D/3D, Cell 2D/3D, with multiple return types
- Near-C++ performance (critical for real-time preview at 128x128+ grids)
- MIT licensed
- Direct Rust integration with serde for JSON interop
- Same algorithm family as FastNoiseLite (C++) which Hytale likely uses

**Consequences:**
- Output may not be pixel-perfect match with Hytale — documented as approximate
- Library maintenance depends on upstream — acceptable risk for a well-established algorithm library

### ADR-4: Zustand over Redux/Context

**Context:** TerraNova needs state management for multiple concerns: editor graph state, project file state, preview settings, template browsing.

**Decision:** Zustand

**Alternatives considered:**
- **Redux Toolkit** — Powerful but heavyweight for this use case
- **React Context** — Causes unnecessary re-renders in large component trees
- **Jotai** — Atom-based, good but less intuitive for store-based patterns

**Rationale:**
- Lightweight (~1KB), minimal boilerplate
- Natural fit with React Flow's state model (both use similar update patterns)
- Easy to create multiple independent stores (editor, project, preview, templates)
- Good TypeScript support
- No provider wrapping needed (reduces component tree complexity)
- Middleware support for undo/redo (temporal middleware)

**Consequences:**
- Less structured than Redux — mitigated by clear store boundaries and TypeScript types
- No built-in devtools as mature as Redux DevTools — acceptable for this project's scale

### ADR-5: GitHub-Only Distribution

**Context:** TerraNova is open-source, zero-profit. All infrastructure must be free.

**Decision:** GitHub-only for all hosting, distribution, templates, CI/CD.

**Services used:**
- **GitHub Repos** — Source code, templates
- **GitHub Releases** — App distribution (platform-specific installers)
- **GitHub Pages** — Template index, documentation
- **GitHub Actions** — CI/CD (build, test, release)
- **GitHub Issues** — Bug tracking
- **GitHub Discussions** — Community Q&A

**Rationale:**
- $0/month for open-source projects
- GitHub Actions free tier is generous for open-source
- GitHub Pages supports custom domains if needed later
- All-in-one platform reduces operational complexity
- Community is already on GitHub

**Consequences:**
- GitHub vendor dependency — mitigated by MIT license (can move anywhere)
- Rate limiting on GitHub API for template downloads — mitigated by caching index, downloading only on user request
- No real-time template updates (PR-based) — acceptable for community contribution model

### ADR-6: 2D Canvas First, 3D WebGL Second

**Context:** TerraNova needs terrain preview visualization. WebGL2 has known issues in Tauri webviews.

**Decision:** 2D Canvas heatmap as primary preview; 3D WebGL mesh as progressive enhancement.

**Rationale:**
- Canvas 2D is universally supported in all webviews
- Heatmaps are useful and sufficient for density function design
- WebGL2 support varies (known issue KI-1)
- Building 2D first ensures every user gets preview functionality
- 3D mesh adds value but isn't required for core workflow

**Consequences:**
- 3D preview may not work on all platforms — acceptable as progressive enhancement
- Users who want pixel-perfect 3D preview should verify on a Hytale server — by design

---

## Setup Instructions for Contributors

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 22.x LTS | [nodejs.org](https://nodejs.org/) or `nvm install 22` |
| **pnpm** | 9.x | `npm install -g pnpm` |
| **Rust** | stable | [rustup.rs](https://rustup.rs/) |
| **Tauri CLI** | 2.x | `pnpm add -D @tauri-apps/cli` (installed via project) |

#### Platform-Specific Requirements

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- macOS 12 Monterey or later

**Windows:**
- Visual Studio Build Tools (C++ workload)
- WebView2 Runtime (usually pre-installed on Windows 10+)
- Windows 10 version 1803 or later

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### Getting Started

```bash
# Clone the repo
git clone https://github.com/HyperSystemsDev/TerraNova.git
cd TerraNova

# Install frontend dependencies
pnpm install

# Start development mode (launches Tauri window with hot reload)
pnpm tauri dev

# Build for production
pnpm tauri build

# Run frontend tests
pnpm test

# Run Rust tests
cd src-tauri && cargo test

# Lint
pnpm lint
```

### Project Structure

```
TerraNova/
├── src-tauri/           # Rust backend (Tauri commands, noise engine, schema, I/O)
│   ├── src/
│   │   ├── main.rs      # Entry point, command registration
│   │   ├── commands/    # IPC command handlers
│   │   ├── noise/       # fastnoise-lite evaluation
│   │   ├── schema/      # V2 type definitions, validation
│   │   └── io/          # File system operations
│   └── Cargo.toml
├── src/                  # React frontend
│   ├── App.tsx          # Root layout
│   ├── components/      # UI components (editor, preview, properties, templates, sidebar, layout)
│   ├── nodes/           # Custom React Flow node components (by category)
│   ├── schema/          # TypeScript V2 type definitions
│   ├── stores/          # Zustand state stores
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utilities (IPC wrappers, graph↔JSON conversion)
├── templates/            # Bundled starter templates
├── public/               # Static assets (icons)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

### Contributing a Node Type

Each V2 node type is an independent React component. To add or improve one:

1. Find the type in `hytale-server-docs/docs/worldgen/` documentation
2. Create/edit the component in `src/nodes/<category>/<TypeName>Node.tsx`
3. Register the node type in `src/nodes/index.ts`
4. Add TypeScript types in `src/schema/<category>.ts`
5. Add Rust types in `src-tauri/src/schema/<category>.rs`
6. Write tests for JSON round-trip serialization

Node types are parallelizable — multiple contributors can work on different node types simultaneously without conflicts.

### Contributing a Template

See the `terranova-templates` repo for the contribution guide:

1. Create a directory with your template name
2. Add `manifest.json` with metadata
3. Add the full `HytaleGenerator/` asset pack
4. Validate against a Hytale server
5. Submit a PR

---

## Project Links

| Resource | URL |
|----------|-----|
| **Source Code** | `https://github.com/HyperSystemsDev/TerraNova` |
| **Templates Repo** | `https://github.com/HyperSystemsDev/terranova-templates` |
| **Worldgen Docs** | `hytale-server-docs/docs/worldgen/` (19 files) |
| **Discord** | `https://discord.gg/SNPjyfkYPc` |
| **HyperPerms** | `https://github.com/HyperSystemsDev/HyperPerms` |
| **HyperHomes** | `https://github.com/HyperSystemsDev/HyperHomes` |
| **HyperFactions** | `https://github.com/HyperSystemsDev/HyperFactions` |

### External References

| Resource | URL |
|----------|-----|
| Tauri v2 Docs | `https://tauri.app/` |
| React Flow Docs | `https://reactflow.dev/` |
| React Three Fiber | `https://docs.pmnd.rs/react-three-fiber/` |
| FastNoiseLite | `https://github.com/Auburn/FastNoiseLite` |
| dagre | `https://github.com/dagrejs/dagre` |
| Zustand | `https://github.com/pmndrs/zustand` |
| Tailwind CSS | `https://tailwindcss.com/` |

---

*Document version 1.0 — February 6, 2026*
