import { create } from "zustand";

interface DragData {
  nodeType: string;
  displayType: string;
  defaults: Record<string, unknown>;
}

interface DragState {
  isDragging: boolean;
  dragData: DragData | null;
  cursorPos: { x: number; y: number };

  startDrag: (data: DragData) => void;
  updateCursor: (x: number, y: number) => void;
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  isDragging: false,
  dragData: null,
  cursorPos: { x: 0, y: 0 },

  startDrag: (dragData) => set({ isDragging: true, dragData }),
  updateCursor: (x, y) => set({ cursorPos: { x, y } }),
  endDrag: () => set({ isDragging: false, dragData: null }),
}));
