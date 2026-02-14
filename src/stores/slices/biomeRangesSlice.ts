import { emit } from "../storeEvents";
import { getMutateAndCommit } from "./historySlice";
import type {
  SliceCreator,
  BiomeRangesSliceState,
  BiomeRangeEntry,
  NoiseRangeConfig,
} from "./types";

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const biomeRangesInitialState = {
  biomeRanges: [] as BiomeRangeEntry[],
  noiseRangeConfig: null as NoiseRangeConfig | null,
  selectedBiomeIndex: null as number | null,
};

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createBiomeRangesSlice: SliceCreator<BiomeRangesSliceState> = (set) => {
  function markDirty() {
    emit("editor:dirty");
  }

  return {
    ...biomeRangesInitialState,

    setBiomeRanges: (ranges) => set({ biomeRanges: ranges }),
    setNoiseRangeConfig: (config) => set({ noiseRangeConfig: config }),

    updateBiomeRange: (index, entry) => {
      set((state) => {
        const ranges = [...state.biomeRanges];
        ranges[index] = { ...ranges[index], ...entry };
        return { biomeRanges: ranges };
      });
    },

    addBiomeRange: (entry) => {
      const mutateAndCommit = getMutateAndCommit();
      mutateAndCommit((state) => ({
        biomeRanges: [...state.biomeRanges, entry],
      }), "Add biome range");
      markDirty();
    },

    removeBiomeRange: (index) => {
      const mutateAndCommit = getMutateAndCommit();
      mutateAndCommit((state) => ({
        biomeRanges: state.biomeRanges.filter((_, i) => i !== index),
        selectedBiomeIndex: state.selectedBiomeIndex === index ? null : state.selectedBiomeIndex,
      }), "Remove biome range");
      markDirty();
    },

    setSelectedBiomeIndex: (index) => set({ selectedBiomeIndex: index }),

    renameBiomeRange: (index, name) => {
      const mutateAndCommit = getMutateAndCommit();
      mutateAndCommit((state) => {
        const ranges = [...state.biomeRanges];
        ranges[index] = { ...ranges[index], Biome: name };
        return { biomeRanges: ranges };
      }, "Rename biome range");
      markDirty();
    },
  };
};
