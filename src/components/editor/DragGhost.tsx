import { useDragStore } from "@/stores/dragStore";

export function DragGhost() {
  const isDragging = useDragStore((s) => s.isDragging);
  const dragData = useDragStore((s) => s.dragData);
  const cursorPos = useDragStore((s) => s.cursorPos);

  if (!isDragging || !dragData) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] px-3 py-1.5 rounded bg-tn-surface border border-tn-border text-sm text-tn-text shadow-lg opacity-75"
      style={{ left: cursorPos.x + 12, top: cursorPos.y + 12 }}
    >
      {dragData.displayType}
    </div>
  );
}
