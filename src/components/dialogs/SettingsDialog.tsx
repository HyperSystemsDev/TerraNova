import { useSettingsStore } from "@/stores/settingsStore";
import { terranovaLanguage } from "@/languages/terranova";
import { hytaleLanguage } from "@/languages/hytale";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { LanguageId, LanguageDefinition } from "@/languages/types";
import type { FlowDirection } from "@/constants";

const LANGUAGES: { def: LanguageDefinition; recommended?: boolean }[] = [
  { def: hytaleLanguage, recommended: true },
  { def: terranovaLanguage },
];

const FLOW_DIRECTIONS: { id: FlowDirection; label: string; description: string }[] = [
  { id: "LR", label: "Left to Right", description: "Inputs on left, output on right (TerraNova default)" },
  { id: "RL", label: "Right to Left", description: "Output on left, inputs on right (Hytale native)" },
];

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const flowDirection = useSettingsStore((s) => s.flowDirection);
  const setFlowDirection = useSettingsStore((s) => s.setFlowDirection);
  const autoLayoutOnOpen = useSettingsStore((s) => s.autoLayoutOnOpen);
  const setAutoLayoutOnOpen = useSettingsStore((s) => s.setAutoLayoutOnOpen);
  const exportPath = useSettingsStore((s) => s.exportPath);
  const setExportPath = useSettingsStore((s) => s.setExportPath);

  async function handleBrowseExportPath() {
    const selected = await openDialog({ directory: true, defaultPath: exportPath ?? undefined });
    if (selected) setExportPath(selected);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-tn-panel border border-tn-border rounded-lg shadow-xl w-[440px] p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Settings</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-tn-text-muted">Node Language</label>
          <div className="flex flex-col gap-2">
            {LANGUAGES.map(({ def, recommended }) => (
              <button
                key={def.id}
                onClick={() => setLanguage(def.id as LanguageId)}
                className={`text-left px-3 py-2 rounded border text-sm ${
                  language === def.id
                    ? "border-tn-accent bg-tn-accent/10"
                    : "border-tn-border bg-tn-bg hover:bg-tn-surface"
                }`}
              >
                <span className="font-medium">{def.displayName}</span>
                {recommended && (
                  <span className="ml-2 text-[10px] text-tn-accent font-medium">Recommended</span>
                )}
                <p className="text-xs text-tn-text-muted mt-0.5">{def.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-tn-text-muted">Graph Flow Direction</label>
          <div className="flex flex-col gap-2">
            {FLOW_DIRECTIONS.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => setFlowDirection(id)}
                className={`text-left px-3 py-2 rounded border text-sm ${
                  flowDirection === id
                    ? "border-tn-accent bg-tn-accent/10"
                    : "border-tn-border bg-tn-bg hover:bg-tn-surface"
                }`}
              >
                <span className="font-medium">{label}</span>
                {id === "LR" && (
                  <span className="ml-2 text-[10px] text-tn-accent font-medium">Default</span>
                )}
                <p className="text-xs text-tn-text-muted mt-0.5">{description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-tn-text-muted">Auto-Layout on File Open</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setAutoLayoutOnOpen(true)}
              className={`text-left px-3 py-2 rounded border text-sm ${
                autoLayoutOnOpen
                  ? "border-tn-accent bg-tn-accent/10"
                  : "border-tn-border bg-tn-bg hover:bg-tn-surface"
              }`}
            >
              <span className="font-medium">Enabled</span>
              <span className="ml-2 text-[10px] text-tn-accent font-medium">Default</span>
              <p className="text-xs text-tn-text-muted mt-0.5">Automatically arrange nodes when opening a file</p>
            </button>
            <button
              onClick={() => setAutoLayoutOnOpen(false)}
              className={`text-left px-3 py-2 rounded border text-sm ${
                !autoLayoutOnOpen
                  ? "border-tn-accent bg-tn-accent/10"
                  : "border-tn-border bg-tn-bg hover:bg-tn-surface"
              }`}
            >
              <span className="font-medium">Disabled</span>
              <p className="text-xs text-tn-text-muted mt-0.5">Preserve original node positions from the JSON file</p>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-tn-text-muted">Default Export Path</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={exportPath ?? "Not set"}
              className="flex-1 px-3 py-1.5 rounded border border-tn-border bg-tn-bg text-sm text-tn-text-muted truncate"
            />
            <button
              onClick={handleBrowseExportPath}
              className="px-3 py-1.5 text-sm rounded border border-tn-border hover:bg-tn-surface whitespace-nowrap"
            >
              Browse...
            </button>
            <button
              onClick={() => setExportPath(null)}
              className="px-3 py-1.5 text-sm rounded border border-tn-border hover:bg-tn-surface text-tn-text-muted"
              disabled={!exportPath}
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-tn-text-muted">Default target directory for File &gt; Export operations</p>
        </div>

        <div className="flex justify-end pt-2 border-t border-tn-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded border border-tn-border hover:bg-tn-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
