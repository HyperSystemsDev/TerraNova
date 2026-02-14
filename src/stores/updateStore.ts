import { create } from "zustand";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready";

interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  progress: number;
  error: string | null;
}

interface UpdateStore extends UpdateState {
  setStatus: (status: UpdateStatus) => void;
  setVersion: (version: string) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: UpdateState = {
  status: "idle",
  version: null,
  progress: 0,
  error: null,
};

export const useUpdateStore = create<UpdateStore>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setVersion: (version) => set({ version }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
