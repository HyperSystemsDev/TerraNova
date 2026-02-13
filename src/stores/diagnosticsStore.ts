import { create } from "zustand";
import type { GraphDiagnostic } from "@/utils/graphDiagnostics";

interface DiagnosticsState {
  diagnostics: GraphDiagnostic[];
  byNodeId: Map<string, GraphDiagnostic[]>;
  setDiagnostics: (diags: GraphDiagnostic[]) => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  diagnostics: [],
  byNodeId: new Map(),
  setDiagnostics: (diags) => {
    const grouped = new Map<string, GraphDiagnostic[]>();
    for (const d of diags) {
      if (d.nodeId) {
        const list = grouped.get(d.nodeId);
        if (list) {
          list.push(d);
        } else {
          grouped.set(d.nodeId, [d]);
        }
      }
    }
    set({ diagnostics: diags, byNodeId: grouped });
  },
}));
