import { create } from "zustand";
import { on } from "./storeEvents";
import type { EditorState } from "./slices/types";
import { createGraphSlice, graphInitialState } from "./slices/graphSlice";
import { createHistorySlice, historyInitialState, _setEditorStateGetter } from "./slices/historySlice";
import { createBiomeSectionsSlice, biomeSectionsInitialState } from "./slices/biomeSectionsSlice";
import { createBiomeRangesSlice, biomeRangesInitialState } from "./slices/biomeRangesSlice";
import { createFileCacheSlice, fileCacheInitialState } from "./slices/fileCacheSlice";
import { createClipboardSlice, clipboardInitialState } from "./slices/clipboardSlice";
import { createConfigSlice, configInitialState } from "./slices/configSlice";

// Re-export types and utilities for consumers
export type {
  EditorState,
  BiomeRangeEntry,
  NoiseRangeConfig,
  BiomeConfig,
  SettingsConfig,
  SectionHistoryEntry,
  BiomeSectionData,
  HistoryEntry,
  FileGraphCache,
} from "./slices/types";
export { loadPersistedHistory } from "./slices/historySlice";

// ---------------------------------------------------------------------------
// Combined store — all useEditorStore((s) => s.xxx) selectors remain identical
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorState>((...args) => {
  const [set] = args;

  return {
    // Note: createHistorySlice MUST be called first because it initializes
    // the mutateAndCommit function used by other slices
    ...createHistorySlice(...args),
    ...createGraphSlice(...args),
    ...createBiomeSectionsSlice(...args),
    ...createBiomeRangesSlice(...args),
    ...createFileCacheSlice(...args),
    ...createClipboardSlice(...args),
    ...createConfigSlice(...args),

    reset: () => set({
      ...graphInitialState,
      ...historyInitialState,
      ...biomeSectionsInitialState,
      ...biomeRangesInitialState,
      ...fileCacheInitialState,
      ...clipboardInitialState,
      ...configInitialState,
    }),
  };
});

// Wire up the editor state getter for history persistence
_setEditorStateGetter(() => useEditorStore.getState());

// Subscribe to project:close to reset editor state
on("project:close", () => {
  useEditorStore.getState().reset();
});
