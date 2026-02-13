# TerraNova

> Offline design studio for Hytale World Generation V2

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord&logo=discord&color=5865F2)](https://discord.gg/SNPjyfkYPc)

TerraNova is a desktop application for visually designing Hytale World Generation V2 asset packs. Build biomes, terrain shapes, and world structures using a node-based editor — then export production-ready JSON files compatible with Hytale's modding API.

## Features

- **Node-Based Editor** — Visual graph editor for density functions, material providers, curves, patterns, positions, props, scanners, vectors, and more
- **Live Preview** — Real-time 2D heatmap with contour lines, cross-sections, and position overlays + 3D voxel heightfield preview with SSAO post-processing
- **Full V2 Coverage** — Supports all 68 density types, 14 material providers, 19 curves, and every other V2 asset category
- **Multi-Section Biome Editing** — Edit Terrain, Material, Pattern, Position, and Prop sections within a single biome file with per-section undo history
- **Asset Pack Management** — Open, edit, validate, and save complete asset packs with multi-file tab support
- **Template System** — 10 bundled templates (Void, Forest, Forest Hills, Desert, Mountains, Floating Islands, Eldritch Spirelands, Shattered Archipelago, Tropical Pirate Islands) or create your own
- **Comparison View** — Side-by-side before/after preview for iterating on terrain changes
- **Schema Validation** — Instant diagnostics on type errors, missing fields, and invalid ranges
- **Bookmarks & History** — Per-tab bookmarks and descriptive undo/redo history with persistent storage across sessions
- **Offline-First** — No server required. All data stays on your machine.

## System Requirements

### Minimum
*Basic editing: up to ~50 nodes, 2D heatmap preview, 1-2 files open*

| Component | Spec |
|-----------|------|
| CPU | Dual-core, 2.0 GHz (Intel i3 8th gen / Ryzen 3 3200G / Apple M1) |
| RAM | 4 GB |
| GPU | Integrated with WebGL 2.0 (Intel UHD 620 / AMD Vega 3) |
| Storage | 200 MB free |
| Display | 1280x720 |
| OS | Windows 10 21H2+ / macOS 11+ / Ubuntu 22.04+ |

### Recommended
*Full workflow: 100-200 nodes, 3D voxel preview, split view, 5+ biome sections*

| Component | Spec |
|-----------|------|
| CPU | Quad-core, 3.0 GHz (Intel i5 10th gen / Ryzen 5 3600 / Apple M1) |
| RAM | 8 GB |
| GPU | Dedicated with 2GB VRAM or strong integrated (GTX 1050+ / Iris Xe / Apple M1) |
| Storage | SSD |
| Display | 1920x1080 |

> TerraNova uses [Tauri](https://tauri.app/) instead of Electron, so the baseline memory footprint is ~80-120 MB (system WebView) rather than ~300-500 MB (bundled Chromium). This is why 4 GB RAM is viable as a minimum.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) 1.77+

### Development

```bash
# Install frontend dependencies
pnpm install

# Launch in development mode (opens app window with hot reload)
pnpm tauri dev
```

### Build

```bash
# Build production bundle
pnpm tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
TerraNova/
├── src/                    # React frontend (TypeScript)
│   ├── components/         # UI components
│   │   ├── editor/         #   Node graph canvas, context menus, biome section tabs
│   │   ├── preview/        #   2D heatmap, 3D voxel preview, comparison view
│   │   ├── layout/         #   Toolbar, status bar, sidebar
│   │   ├── home/           #   Home screen, recent projects
│   │   ├── properties/     #   Node property inspector panel
│   │   └── templates/      #   Template browser
│   ├── nodes/              # React Flow node components per V2 category
│   │   ├── density/        #   68 density function node types
│   │   ├── material/       #   14 material provider node types
│   │   ├── curves/         #   19 curve node types
│   │   ├── patterns/       #   Pattern node types
│   │   ├── positions/      #   Position provider node types
│   │   ├── props/          #   Prop provider node types
│   │   ├── environment/    #   Environment provider node types
│   │   ├── scanners/       #   Scanner node types
│   │   ├── vectors/        #   Vector node types
│   │   ├── assignments/    #   Assignment node types
│   │   └── shared/         #   BaseNode component, handle registry
│   ├── schema/             # TypeScript type definitions for V2 assets
│   ├── stores/             # Zustand state stores (editor, preview, project, UI)
│   ├── hooks/              # Custom React hooks (Tauri IPC, keyboard shortcuts)
│   └── utils/              # Utility functions (graph conversion, layout, colormaps)
├── src-tauri/              # Tauri + Rust backend
│   └── src/
│       ├── commands/       #   Tauri command handlers
│       ├── schema/         #   Rust V2 schema types (serde)
│       ├── noise/          #   Density function evaluator
│       └── io/             #   Asset pack I/O and template system
├── templates/              # Bundled world generation templates
└── public/                 # Static assets
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2](https://tauri.app/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Node Editor | [@xyflow/react](https://reactflow.dev/) (React Flow) |
| 3D Preview | [React Three Fiber](https://r3f.docs.pmnd.rs/) + [Three.js](https://threejs.org/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Build | [Vite](https://vite.dev/) with code-split chunks (Three.js, ReactFlow, dagre) |
| Backend | [Rust](https://www.rust-lang.org/) |
| Noise | [fastnoise-lite](https://github.com/Auburn/FastNoiseLite) |

## Performance

TerraNova is optimized for large biome files with 100-200+ nodes across multiple sections:

- **O(1) Node Rendering** — Every node component is wrapped in `React.memo` with hoisted handle arrays, so only changed nodes re-render during interactions (not all 200)
- **Instant Undo/Redo** — History snapshots are restored by reference without redundant deep-cloning, keeping undo under 1ms even at 200 nodes
- **Smart Cloning** — `commitState` uses a WeakMap cache to skip `structuredClone` on unchanged fields between commits
- **Bounded Memory** — History caps (50 global / 30 per-section) and LRU file cache eviction (10 files) prevent unbounded memory growth
- **Lazy 3D Loading** — Three.js and post-processing dependencies (~1.1 MB) are loaded on demand via `React.lazy`, keeping initial load at ~580 KB
- **Chunk Splitting** — Vite splits vendor dependencies (Three.js, ReactFlow, dagre) into separate chunks for parallel loading and long-term caching
- **Canvas Optimization** — Contour generation is memoized separately from overlay drawing; SSAO uses 8 samples for better frame budget on integrated GPUs
- **CSS Performance** — Handle hover effects use `outline` instead of `box-shadow` to avoid paint storms across 600+ handles

## Links

- [Discord Server](https://discord.gg/SNPjyfkYPc)
- [HyperSystemsDev GitHub](https://github.com/HyperSystemsDev)

## License

[MIT](LICENSE)
