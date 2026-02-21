# McCal's Teachings

Created: 2026-02-21

This short document captures what I learned while auditing and improving the TerraNova UI and preview systems.

## Key takeaways

- Keep UI text concise and context-aware: replace technical jargon ("dock") with user-friendly affordances or compact icons. Use sr-only labels to preserve accessibility.
- Avoid rendering large empty UI placeholders in small zones — show compact contextual affordances instead (icons + minimal text). Use ResizeObserver to decide when to render placeholders.
- Prefer DOM overlays for HUDs instead of rendering HUD elements inside the Three.js canvas; this avoids z-order and interaction issues.
- When adding persistence (save/export), write to the canonical project files (e.g., embed Visuals into `MainWorld.json`) so existing export pipelines pick up changes.
- Keep transformations deterministic: verify that `internalToHytale` (or other exporters) accept the wrapped structure you write (e.g., a top-level `Visuals` object) before adding save/export buttons.
- Accessibility matters: when removing visible text, replace it with icons + `aria-label`/`sr-only` to keep keyboard/screen-reader users supported.

## Implementation notes

- Replaced visible "dock" and "panels" text in multiple places with icons and sr-only labels. Files changed include `DockZone.tsx`, `PreviewPanel.tsx`, `EditorControls.tsx`, and `TitleBar.tsx`.
- Added a ResizeObserver in `DockZone` to avoid showing placeholders in very small header/toolbox areas.
- Moved HUD out of the Three.js `Canvas` in `VoxelPreview3D` so it lives as a DOM overlay.
- Scene environment controls were refactored into `SceneEnvironmentPanel` and now support "Save to project" (writes Visuals into `MainWorld.json`) and "Export to folder" (writes a standalone Env JSON).

## Small checklist for follow-ups

- [ ] Run TypeScript dev build and fix any type/runtime errors introduced by recent edits.
- [ ] Add import flow for environment JSON to mirror the export flow.
- [ ] Make the SceneEnvironment panel dockable/floating and add presets/undo support.
- [ ] Add unit tests targeting `previewStore` and visual export transformation.

If you'd like this exported as a shorter in-app help tooltip or added to the project README, I can add that next.

## Known issues & current notes

- There are a few bugs currently under investigation:
	- Material key drag/move may not respond and can disappear when clicking — likely related to floating/docking interaction or DOM ordering; needs reproduction and targeted fixes in the panel/tab drag handlers.
	- Some UI wiring isn't fully complete yet (floating/docking flags, panel persistence and snap-back), so a few components can behave inconsistently after moves.
	- Several small polish items remain before a larger UI overhaul: input clamping, undo/redo for environment changes, and an import flow for exported Env JSON files.

UI overhaul soon™ — create a focused branch for the overhaul after we stabilize the above bugs.
