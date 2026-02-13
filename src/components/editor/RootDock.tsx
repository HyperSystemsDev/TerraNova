import { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useEditorStore } from "@/stores/editorStore";
import { useLanguage } from "@/languages/useLanguage";

const ROOT_COLOR = "#8B4450";

export function RootDock() {
  const [collapsed, setCollapsed] = useState(false);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const { getTypeDisplayName } = useLanguage();
  const reactFlow = useReactFlow();

  // Find the Root node in the graph
  const rootNode = nodes.find((n) => n.type === "Root");

  // Find the source node feeding into Root
  const rootEdge = rootNode ? edges.find((e) => e.target === rootNode.id) : null;
  const sourceNode = rootEdge ? nodes.find((n) => n.id === rootEdge.source) : null;
  const sourceType = sourceNode
    ? ((sourceNode.data as Record<string, unknown>).type as string) ?? "Unknown"
    : null;
  const displayName = sourceType ? getTypeDisplayName(sourceType) : null;

  const hasRoot = !!rootNode;
  const hasConnection = !!sourceNode;

  const handleNavigate = useCallback(() => {
    if (!rootNode) return;
    reactFlow.fitView({
      nodes: [{ id: rootNode.id }],
      padding: 0.5,
      duration: 300,
    });
  }, [rootNode, reactFlow]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((c) => !c);
  }, []);

  // Collapsed: just a small circle tab on the right edge
  if (collapsed) {
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={handleToggle}
          title="Show Root Dock"
          className="flex items-center justify-center w-7 h-7 rounded-full border"
          style={{
            background: "#262320",
            borderColor: hasConnection ? ROOT_COLOR : "#5a5347",
            boxShadow: hasConnection
              ? `0 0 8px rgba(139,68,80,0.15), 0 2px 6px rgba(0,0,0,0.3)`
              : "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: hasConnection ? ROOT_COLOR : "transparent",
              border: hasConnection ? "none" : "1.5px dashed #5a5347",
              boxShadow: hasConnection ? `0 0 4px rgba(139,68,80,0.4)` : "none",
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
      {hasRoot && hasConnection ? (
        <div
          className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 border"
          style={{
            background: "#262320",
            borderColor: ROOT_COLOR,
            boxShadow: `0 0 12px rgba(139,68,80,0.2), 0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Port indicator — click to navigate */}
          <div
            className="w-3 h-3 rounded-full shrink-0 cursor-pointer"
            onClick={handleNavigate}
            title="Go to Root node"
            style={{
              background: ROOT_COLOR,
              boxShadow: `0 0 6px rgba(139,68,80,0.5)`,
            }}
          />
          <div className="flex flex-col items-start cursor-pointer" onClick={handleNavigate}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ROOT_COLOR }}>
              Root
            </span>
            <span className="text-xs text-tn-text leading-tight">{displayName}</span>
          </div>
          {/* Collapse button */}
          <button
            onClick={handleToggle}
            title="Hide Root Dock"
            className="ml-1 flex items-center justify-center w-5 h-5 rounded-full text-tn-text-muted hover:text-tn-text transition-colors"
            style={{ fontSize: 10 }}
          >
            &rsaquo;
          </button>
        </div>
      ) : hasRoot ? (
        <div
          className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 border"
          style={{
            background: "#262320",
            borderColor: ROOT_COLOR,
            boxShadow: `0 0 8px rgba(139,68,80,0.1), 0 2px 6px rgba(0,0,0,0.3)`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0 cursor-pointer"
            onClick={handleNavigate}
            title="Go to Root node"
            style={{
              background: "transparent",
              border: `1.5px dashed ${ROOT_COLOR}`,
            }}
          />
          <span
            className="text-[10px] cursor-pointer"
            style={{ color: ROOT_COLOR }}
            onClick={handleNavigate}
          >
            No Input
          </span>
          <button
            onClick={handleToggle}
            title="Hide Root Dock"
            className="ml-1 flex items-center justify-center w-5 h-5 rounded-full text-tn-text-muted hover:text-tn-text transition-colors"
            style={{ fontSize: 10 }}
          >
            &rsaquo;
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5"
          style={{
            background: "#262320",
            border: "1px dashed #5a5347",
          }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{
              background: "transparent",
              border: "1.5px dashed #5a5347",
            }}
          />
          <span className="text-[10px] text-tn-text-muted">No Root</span>
          <button
            onClick={handleToggle}
            title="Hide Root Dock"
            className="ml-1 flex items-center justify-center w-5 h-5 rounded-full text-tn-text-muted hover:text-tn-text transition-colors"
            style={{ fontSize: 10 }}
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
