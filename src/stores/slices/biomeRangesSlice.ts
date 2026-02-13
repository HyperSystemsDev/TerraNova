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
      }), "Remove biome range");
      markDirty();
    },
  };
};
