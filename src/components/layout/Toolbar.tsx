import { useEffect, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useTauriIO } from "@/hooks/useTauriIO";
import { useEditorStore } from "@/stores/editorStore";
import { BridgeDialog } from "@/components/dialogs/BridgeDialog";
import UISettingsDialog from "@/components/dialogs/UISettingsDialog";
import { useUIStore } from "@/stores/uiStore";
import { saveRef } from "@/utils/saveRef";
import { handleAutoLayout, handleAutoLayoutSelected, handleTidyUp } from "@/utils/layoutActions";

export function Toolbar() {
  const { saveFile } = useTauriIO();
  const reactFlow = useReactFlow();

  // Register saveRef so App.tsx can call saveFile from outside ReactFlowProvider
  useEffect(() => {
    saveRef.current = saveFile;
    return () => {
      saveRef.current = null;
    };
  }, [saveFile]);

  // Get selected count for enable/disable logic
  const selectedCount = useEditorStore(
    useCallback(
      (s: { nodes: { selected?: boolean }[] }) =>
        s.nodes.reduce((count, n) => count + (n.selected ? 1 : 0), 0),
      [],
    ),
  );

  return (
    <>
      <div className="flex items-center h-10 px-2 bg-tn-surface border-b border-tn-border shrink-0">
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 text-[11px] hover:bg-tn-surface rounded text-tn-text-muted"
            onClick={() => handleAutoLayout(reactFlow)}
            title="Auto Layout All (L)"
          >
            ⊞ Layout All
          </button>
          <button
            className={`px-2 py-1 text-[11px] rounded ${selectedCount < 2
              ? "text-tn-text-muted/40 cursor-default"
              : "hover:bg-tn-surface text-tn-text-muted"
              }`}
            onClick={handleAutoLayoutSelected}
            disabled={selectedCount < 2}
            title="Auto Layout Selected (Shift+L)"
          >
            ⊞ Layout Selected
          </button>
          <button
            className="px-2 py-1 text-[11px] hover:bg-tn-surface rounded text-tn-text-muted"
            onClick={handleTidyUp}
            title="Tidy Up (Ctrl+Shift+L)"
          >
            ⊞ Tidy Up
          </button>
        </div>

        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-[11px] hover:bg-tn-surface rounded text-tn-text-muted"
            onClick={() => useUIStore.getState().setSettingsOpen(true)}
            title="UI Settings"
          >
            ⚙ UI
          </button>
        </div>
      </div>

      <BridgeDialog />
      <UISettingsDialog />
    </>
  );
}
