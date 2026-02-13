import type { Node } from "@xyflow/react";
import {
  copyNodesToClipboard,
  pasteNodesFromClipboard,
  readClipboardData,
} from "@/utils/clipboard";
import type { ClipboardData } from "@/utils/clipboard";
import { emit } from "../storeEvents";
import { getMutateAndCommit } from "./historySlice";
import type { SliceCreator, ClipboardSliceState } from "./types";

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const clipboardInitialState = {
  _clipboardData: null as ClipboardData | null,
};

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createClipboardSlice: SliceCreator<ClipboardSliceState> = (set, get) => {
  function markDirty() {
    emit("editor:dirty");
  }

  function cleanOutputNodes(nodes: Node[]): Node[] {
    return nodes.map((n) => {
      const d = n.data as Record<string, unknown>;
      if (d._outputNode) {
        const { _outputNode: _, ...rest } = d;
        return { ...n, data: rest };
      }
      return n;
    });
  }

  return {
    ...clipboardInitialState,

    copyNodes: () => {
      const { nodes, edges } = get();
      const data = copyNodesToClipboard(nodes, edges);
      if (data) {
        set({ _clipboardData: data });
      }
    },

    pasteNodes: async (offsetX = 50, offsetY = 50) => {
      const mutateAndCommit = getMutateAndCommit();
      let data = await readClipboardData();
      if (!data) {
        data = get()._clipboardData;
      }
      if (!data) return;

      const pasted = pasteNodesFromClipboard(data, offsetX, offsetY);
      const cleanedNodes = cleanOutputNodes(pasted.nodes);

      mutateAndCommit((state) => ({
        nodes: [
          ...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          ...cleanedNodes,
        ],
        edges: [...state.edges, ...pasted.edges],
      }), "Paste");
      markDirty();
    },

    duplicateNodes: () => {
      const mutateAndCommit = getMutateAndCommit();
      const { nodes, edges } = get();
      const data = copyNodesToClipboard(nodes, edges);
      if (!data) return;

      const pasted = pasteNodesFromClipboard(data, 50, 50);
      const cleanedNodes = cleanOutputNodes(pasted.nodes);

      mutateAndCommit((state) => ({
        nodes: [
          ...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          ...cleanedNodes,
        ],
        edges: [...state.edges, ...pasted.edges],
      }), "Duplicate");
      markDirty();
    },

    addSnippet: (newNodes, newEdges) => {
      const mutateAndCommit = getMutateAndCommit();
      mutateAndCommit((state) => ({
        nodes: [
          ...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          ...newNodes,
        ],
        edges: [...state.edges, ...newEdges],
      }), "Add snippet");
      markDirty();
    },
  };
};
