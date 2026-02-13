import { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import type { MaterialLayer } from "@/utils/biomeSectionUtils";
import type { ConditionType } from "@/schema/material";
import { LAYER_CONTEXT_OPTIONS } from "./constants";
import { ConditionBadge, ConditionEditor } from "./ConditionEditor";
import { DraggableLayerList } from "./DraggableLayerList";

export function V2LayerEditor({
  sadNodeId,
  layers,
  onSelectNode,
}: {
  sadNodeId: string;
  layers: MaterialLayer[];
  onSelectNode: (id: string) => void;
}) {
  const biomeSections = useEditorStore((s) => s.biomeSections);
  const updateNodeField = useEditorStore((s) => s.updateNodeField);
  const addMaterialLayer = useEditorStore((s) => s.addMaterialLayer);
  const removeMaterialLayer = useEditorStore((s) => s.removeMaterialLayer);
  const reorderMaterialLayers = useEditorStore((s) => s.reorderMaterialLayers);
  const changeMaterialLayerType = useEditorStore((s) => s.changeMaterialLayerType);

  const [conditionExpanded, setConditionExpanded] = useState(false);

  // Get SpaceAndDepth node fields
  const section = biomeSections?.MaterialProvider;
  const sadNode = section?.nodes.find((n) => n.id === sadNodeId);
  const sadData = sadNode?.data as Record<string, unknown> | undefined;
  const sadFields = (sadData?.fields as Record<string, unknown>) ?? {};

  const layerContext = (sadFields.LayerContext as string) ?? "DEPTH_INTO_FLOOR";
  const maxExpectedDepth = (sadFields.MaxExpectedDepth as number) ?? 16;

  // Get condition info
  const conditionData = sadFields.Condition as Record<string, unknown> | undefined;
  const conditionType = (conditionData?.Type as ConditionType) ?? "AlwaysTrueCondition";

  // V2 layers (those with layerIndex defined)
  const v2Layers = layers.filter((l) => l.layerIndex != null);

  // Find layer node IDs from edges
  const layerNodeIds = new Map<number, string>();
  if (section) {
    for (const e of section.edges) {
      if (e.target === sadNodeId && /^Layers\[\d+\]$/.test(e.targetHandle ?? "")) {
        const idx = parseInt(/\[(\d+)\]/.exec(e.targetHandle!)![1]);
        layerNodeIds.set(idx, e.source);
      }
    }
  }

  const handleAddLayer = useCallback(() => {
    addMaterialLayer(sadNodeId, "ConstantThickness");
  }, [sadNodeId, addMaterialLayer]);

  const handleRemoveLayer = useCallback((index: number) => {
    removeMaterialLayer(sadNodeId, index);
  }, [sadNodeId, removeMaterialLayer]);

  const handleChangeType = useCallback((layerIndex: number, newType: string) => {
    const nodeId = layerNodeIds.get(layerIndex);
    if (nodeId) {
      changeMaterialLayerType(nodeId, newType, sadNodeId);
    }
  }, [layerNodeIds, sadNodeId, changeMaterialLayerType]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    reorderMaterialLayers(sadNodeId, fromIndex, toIndex);
  }, [sadNodeId, reorderMaterialLayers]);

  const handleConditionTypeChange = useCallback((newType: ConditionType) => {
    const base: Record<string, unknown> = { Type: newType };
    if (newType === "EqualsCondition") {
      base.ContextToCheck = "SPACE_ABOVE_FLOOR";
      base.Value = 0;
    } else if (newType === "GreaterThanCondition" || newType === "SmallerThanCondition") {
      base.ContextToCheck = "SPACE_ABOVE_FLOOR";
      base.Threshold = 0;
    }
    updateNodeField(sadNodeId, "Condition", base);
  }, [sadNodeId, updateNodeField]);

  const handleConditionFieldChange = useCallback((field: string, value: unknown) => {
    const current = { ...(conditionData ?? { Type: conditionType }) };
    current[field] = value;
    updateNodeField(sadNodeId, "Condition", current);
  }, [sadNodeId, conditionData, conditionType, updateNodeField]);

  return (
    <div className="flex flex-col p-3 gap-3">
      {/* Header */}
      <div className="border-b border-tn-border pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Material Layers</h3>
          <button
            onClick={handleAddLayer}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-white/5 border border-tn-border text-tn-text hover:bg-white/10 transition-colors"
            title="Add new layer"
          >
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add
          </button>
        </div>
        <p className="text-xs text-tn-text-muted mt-0.5">
          {v2Layers.length} layer{v2Layers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* SpaceAndDepth settings */}
      <div className="flex flex-col gap-2 p-2 rounded border border-tn-border bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-tn-text-muted shrink-0 w-16">Context</label>
          <select
            value={layerContext}
            onChange={(e) => updateNodeField(sadNodeId, "LayerContext", e.target.value)}
            className="flex-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text"
          >
            {LAYER_CONTEXT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-tn-text-muted shrink-0 w-16">Max Depth</label>
          <input
            type="number"
            value={maxExpectedDepth}
            onChange={(e) => updateNodeField(sadNodeId, "MaxExpectedDepth", parseInt(e.target.value) || 0)}
            className="flex-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text w-16"
            min={0}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-tn-text-muted shrink-0 w-16">Condition</label>
          <button
            onClick={() => setConditionExpanded((v) => !v)}
            className="flex-1 flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text hover:bg-white/5 transition-colors text-left"
          >
            <ConditionBadge type={conditionType} />
            <svg
              className={`w-3 h-3 text-tn-text-muted ml-auto transition-transform ${conditionExpanded ? "rotate-180" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Condition editor (expandable) */}
      {conditionExpanded && (
        <ConditionEditor
          conditionType={conditionType}
          conditionData={conditionData}
          onTypeChange={handleConditionTypeChange}
          onFieldChange={handleConditionFieldChange}
        />
      )}

      {/* Layer list */}
      {v2Layers.length === 0 ? (
        <div className="text-xs text-tn-text-muted text-center py-4">
          No layers yet. Click "Add" to create one.
        </div>
      ) : (
        <DraggableLayerList
          layers={v2Layers}
          onSelectNode={onSelectNode}
          onRemove={handleRemoveLayer}
          onChangeType={handleChangeType}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}
