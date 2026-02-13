import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useUIStore, type Bookmark } from "@/stores/uiStore";

export function BookmarkPanel() {
  const bookmarks = useUIStore((s) => s.bookmarks);
  const removeBookmark = useUIStore((s) => s.removeBookmark);
  const renameBookmark = useUIStore((s) => s.renameBookmark);
  const setBookmark = useUIStore((s) => s.setBookmark);
  const reactFlow = useReactFlow();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Sort by slot number
  const sortedBookmarks = Array.from(bookmarks.entries()).sort(
    ([a], [b]) => a - b,
  );

  function jumpToBookmark(bookmark: Bookmark) {
    reactFlow.setViewport(
      { x: bookmark.x, y: bookmark.y, zoom: bookmark.zoom },
      { duration: 300 },
    );
  }

  function handleSaveHere() {
    // Find next available slot (1-9)
    for (let i = 1; i <= 9; i++) {
      if (!bookmarks.has(i)) {
        const viewport = reactFlow.getViewport();
        setBookmark(i, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
        return;
      }
    }
    // All slots full — overwrite slot 9
    const viewport = reactFlow.getViewport();
    setBookmark(9, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
  }

  function startRename(slot: number) {
    const bm = bookmarks.get(slot);
    setEditingSlot(slot);
    setEditLabel(bm?.label ?? "");
  }

  function commitRename() {
    if (editingSlot !== null) {
      renameBookmark(editingSlot, editLabel.trim());
      setEditingSlot(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-tn-border">
        <span className="text-[11px] font-medium text-tn-text-muted uppercase tracking-wider">
          Bookmarks
        </span>
        <button
          onClick={handleSaveHere}
          className="text-[10px] px-2 py-0.5 bg-tn-accent/20 text-tn-accent rounded hover:bg-tn-accent/30"
          title="Save current viewport as a bookmark"
        >
          + Save Here
        </button>
      </div>

      {sortedBookmarks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-tn-text-muted text-sm mb-1">No bookmarks</div>
            <div className="text-[10px] text-tn-text-muted/70">
              Press Ctrl+Shift+1-9 to save viewport positions,
              or use the button above.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sortedBookmarks.map(([slot, bookmark]) => (
            <div
              key={slot}
              className="group flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 border-b border-tn-border/30"
            >
              {/* Slot number badge */}
              <span className="w-5 h-5 rounded bg-tn-accent/20 text-tn-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                {slot}
              </span>

              {/* Label (editable on double-click) */}
              {editingSlot === slot ? (
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingSlot(null);
                  }}
                  autoFocus
                  className="flex-1 min-w-0 px-1 py-0.5 text-[11px] bg-tn-bg border border-tn-border rounded focus:outline-none focus:border-tn-accent"
                />
              ) : (
                <button
                  onClick={() => jumpToBookmark(bookmark)}
                  onDoubleClick={() => startRename(slot)}
                  className="flex-1 min-w-0 text-left text-[11px] truncate"
                  title={`Click to jump, double-click to rename\nAlt+${slot} to jump`}
                >
                  {bookmark.label || `Bookmark ${slot}`}
                </button>
              )}

              {/* Zoom level */}
              <span className="text-[9px] text-tn-text-muted shrink-0">
                {Math.round(bookmark.zoom * 100)}%
              </span>

              {/* Delete button */}
              <button
                onClick={() => removeBookmark(slot)}
                className="opacity-0 group-hover:opacity-100 text-tn-text-muted hover:text-red-400 text-[10px] shrink-0 transition-opacity"
                title="Remove bookmark"
              >
                \u2716
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-1.5 border-t border-tn-border text-[9px] text-tn-text-muted/60">
        Ctrl+Shift+1-9 save \u00B7 Alt+1-9 jump
      </div>
    </div>
  );
}
