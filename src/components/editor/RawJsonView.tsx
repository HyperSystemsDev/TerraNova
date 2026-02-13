import { useEditorStore } from "@/stores/editorStore";

export function RawJsonView() {
  const rawJsonContent = useEditorStore((s) => s.rawJsonContent);

  if (!rawJsonContent) {
    return (
      <div className="flex items-center justify-center h-full text-tn-text-muted text-sm">
        No content to display.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 bg-tn-bg">
      <div className="text-xs text-tn-text-muted mb-2">Read-only JSON view (unrecognized file type)</div>
      <pre className="text-xs text-tn-text font-mono whitespace-pre-wrap break-words bg-tn-bg-secondary rounded p-3 border border-tn-border">
        {JSON.stringify(rawJsonContent, null, 2)}
      </pre>
    </div>
  );
}
