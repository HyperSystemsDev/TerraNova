import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useDiagnosticsStore } from "@/stores/diagnosticsStore";
import type { GraphDiagnostic } from "@/utils/graphDiagnostics";

const SEVERITY_COLORS: Record<string, string> = {
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

const SEVERITY_ICONS: Record<string, string> = {
  error: "\u2716",
  warning: "\u26A0",
  info: "\u2139",
};

export function DiagnosticsStrip() {
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const diagnostics = useDiagnosticsStore((s) => s.diagnostics);
  const [expanded, setExpanded] = useState(false);

  if (diagnostics.length === 0) return null;

  const counts = diagnostics.reduce(
    (acc, d) => {
      acc[d.severity] = (acc[d.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const summary = [
    counts.error && `${counts.error} error${counts.error > 1 ? "s" : ""}`,
    counts.warning && `${counts.warning} warning${counts.warning > 1 ? "s" : ""}`,
    counts.info && `${counts.info} info`,
  ]
    .filter(Boolean)
    .join(", ");

  function handleDiagnosticClick(d: GraphDiagnostic) {
    if (d.nodeId) {
      setSelectedNodeId(d.nodeId);
    }
  }

  return (
    <div className="shrink-0 border-b border-tn-border bg-tn-surface/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1 text-[10px] text-tn-text-muted hover:text-tn-text transition-colors"
      >
        <span>{expanded ? "\u25BC" : "\u25B6"}</span>
        <span>{summary}</span>
      </button>

      {expanded && (
        <div className="max-h-32 overflow-y-auto px-3 pb-1.5">
          {diagnostics.map((d, i) => (
            <button
              key={i}
              onClick={() => handleDiagnosticClick(d)}
              className={`block w-full text-left text-[10px] py-0.5 hover:bg-white/5 rounded px-1 ${
                d.nodeId ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className={SEVERITY_COLORS[d.severity]}>
                {SEVERITY_ICONS[d.severity]}
              </span>{" "}
              <span className="text-tn-text-muted">{d.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
