import { useReactFlow } from "@xyflow/react";
import { useDiagnosticsStore } from "@/stores/diagnosticsStore";
import { useEditorStore } from "@/stores/editorStore";
import type { GraphDiagnostic, DiagnosticSeverity } from "@/utils/graphDiagnostics";

const SEVERITY_ORDER: DiagnosticSeverity[] = ["error", "warning", "info"];

const SEVERITY_COLORS: Record<DiagnosticSeverity, string> = {
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

const SEVERITY_ICONS: Record<DiagnosticSeverity, string> = {
  error: "\u2716",
  warning: "\u26A0",
  info: "\u2139",
};

const SEVERITY_LABELS: Record<DiagnosticSeverity, string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
};

export function ValidationPanel() {
  const diagnostics = useDiagnosticsStore((s) => s.diagnostics);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const reactFlow = useReactFlow();

  // Group by severity
  const grouped = new Map<DiagnosticSeverity, GraphDiagnostic[]>();
  for (const d of diagnostics) {
    const list = grouped.get(d.severity);
    if (list) {
      list.push(d);
    } else {
      grouped.set(d.severity, [d]);
    }
  }

  const counts = {
    error: grouped.get("error")?.length ?? 0,
    warning: grouped.get("warning")?.length ?? 0,
    info: grouped.get("info")?.length ?? 0,
  };

  function handleClick(d: GraphDiagnostic) {
    if (!d.nodeId) return;
    setSelectedNodeId(d.nodeId);
    reactFlow.fitView({
      nodes: [{ id: d.nodeId }],
      padding: 0.3,
      duration: 300,
    });
  }

  if (diagnostics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tn-text-muted gap-2 px-4">
        <span className="text-2xl text-green-400">{"\u2714"}</span>
        <span className="text-xs">No issues found</span>
      </div>
    );
  }

  const summaryParts = [
    counts.error > 0 && `${counts.error} error${counts.error > 1 ? "s" : ""}`,
    counts.warning > 0 && `${counts.warning} warning${counts.warning > 1 ? "s" : ""}`,
    counts.info > 0 && `${counts.info} info`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      {/* Summary header */}
      <div className="shrink-0 px-3 py-2 border-b border-tn-border text-[11px] text-tn-text-muted">
        {summaryParts.join(", ")}
      </div>

      {/* Grouped diagnostics */}
      <div className="flex-1 overflow-y-auto">
        {SEVERITY_ORDER.map((severity) => {
          const items = grouped.get(severity);
          if (!items || items.length === 0) return null;
          return (
            <div key={severity} className="mb-1">
              <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_COLORS[severity]}`}>
                {SEVERITY_LABELS[severity]} ({items.length})
              </div>
              {items.map((d, i) => (
                <button
                  key={`${severity}-${i}`}
                  onClick={() => handleClick(d)}
                  className={`w-full text-left px-3 py-1 text-[11px] hover:bg-white/5 transition-colors flex items-start gap-1.5 ${
                    d.nodeId ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className={`shrink-0 ${SEVERITY_COLORS[severity]}`}>
                    {SEVERITY_ICONS[severity]}
                  </span>
                  <span className="text-tn-text-muted leading-tight">{d.message}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
