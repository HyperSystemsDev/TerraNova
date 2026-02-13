import type { ConditionType } from "@/schema/material";
import { CONDITION_TYPES, CONDITION_TYPE_LABELS, CONDITION_PARAMS } from "./constants";

export function ConditionBadge({ type }: { type: ConditionType }) {
  const label = CONDITION_TYPE_LABELS[type] ?? type;
  return (
    <span className="text-[10px] font-medium px-1 py-0.5 rounded leading-none bg-cyan-500/15 text-cyan-400">
      {label}
    </span>
  );
}

export function ConditionEditor({
  conditionType,
  conditionData,
  onTypeChange,
  onFieldChange,
}: {
  conditionType: ConditionType;
  conditionData?: Record<string, unknown>;
  onTypeChange: (type: ConditionType) => void;
  onFieldChange: (field: string, value: unknown) => void;
}) {
  const isComparison = conditionType === "EqualsCondition" ||
    conditionType === "GreaterThanCondition" ||
    conditionType === "SmallerThanCondition";
  const isCompound = conditionType === "AndCondition" ||
    conditionType === "OrCondition" ||
    conditionType === "NotCondition";

  return (
    <div className="flex flex-col gap-2 p-2 rounded border border-tn-border bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-tn-text-muted shrink-0 w-12">Type</label>
        <select
          value={conditionType}
          onChange={(e) => onTypeChange(e.target.value as ConditionType)}
          className="flex-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text"
        >
          {CONDITION_TYPES.map((t) => (
            <option key={t} value={t}>{CONDITION_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {isComparison && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-tn-text-muted shrink-0 w-12">Check</label>
            <select
              value={(conditionData?.ContextToCheck as string) ?? "SPACE_ABOVE_FLOOR"}
              onChange={(e) => onFieldChange("ContextToCheck", e.target.value)}
              className="flex-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text"
            >
              {CONDITION_PARAMS.map((p) => (
                <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-tn-text-muted shrink-0 w-12">
              {conditionType === "EqualsCondition" ? "Value" : "Threshold"}
            </label>
            <input
              type="number"
              value={(conditionData?.[conditionType === "EqualsCondition" ? "Value" : "Threshold"] as number) ?? 0}
              onChange={(e) => onFieldChange(
                conditionType === "EqualsCondition" ? "Value" : "Threshold",
                parseInt(e.target.value) || 0,
              )}
              className="flex-1 text-[11px] px-1.5 py-0.5 bg-tn-bg border border-tn-border rounded text-tn-text w-16"
            />
          </div>
        </>
      )}

      {isCompound && (
        <p className="text-[10px] text-tn-text-muted italic">
          Compound condition tree editing is not yet supported. Use the graph editor for complex conditions.
        </p>
      )}
    </div>
  );
}
