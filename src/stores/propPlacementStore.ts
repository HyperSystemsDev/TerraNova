import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import {
  evaluatePositions,
  type EvaluatedPosition,
  type WorldRange,
} from "@/utils/positionEvaluator";

interface PropPlacementState {
  worldRange: WorldRange;
  showGrid: boolean;
  showDensityOverlay: boolean;
  seed: number;
  positions: EvaluatedPosition[];
  positionCount: number;
  /** Placeholder for future async evaluation. Currently set synchronously so never observable by React. */
  isEvaluating: boolean;
  evaluationError: string | null;

  // Actions
  setWorldRange: (range: WorldRange) => void;
  setShowGrid: (show: boolean) => void;
  setShowDensityOverlay: (show: boolean) => void;
  setSeed: (seed: number) => void;
  evaluate: (nodes: Node[], edges: Edge[], rootNodeId?: string) => void;
  reset: () => void;
}

const DEFAULT_RANGE: WorldRange = { minX: -64, maxX: 64, minZ: -64, maxZ: 64 };

export const usePropPlacementStore = create<PropPlacementState>((set, get) => ({
  worldRange: DEFAULT_RANGE,
  showGrid: true,
  showDensityOverlay: false,
  seed: 42,
  positions: [],
  positionCount: 0,
  isEvaluating: false,
  evaluationError: null,

  setWorldRange: (worldRange) => set({ worldRange }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowDensityOverlay: (showDensityOverlay) => set({ showDensityOverlay }),
  setSeed: (seed) => set({ seed }),

  evaluate: (nodes, edges, rootNodeId?) => {
    const { worldRange, seed } = get();
    set({ isEvaluating: true, evaluationError: null });
    try {
      const positions = evaluatePositions(nodes, edges, worldRange, seed, rootNodeId);
      set({ positions, positionCount: positions.length, isEvaluating: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ positions: [], positionCount: 0, isEvaluating: false, evaluationError: msg });
    }
  },

  reset: () =>
    set({
      worldRange: DEFAULT_RANGE,
      showGrid: true,
      showDensityOverlay: false,
      seed: 42,
      positions: [],
      positionCount: 0,
      isEvaluating: false,
      evaluationError: null,
    }),
}));
