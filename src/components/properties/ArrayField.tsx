import { useState } from "react";
import { FieldTooltip } from "./FieldTooltip";

interface ArrayFieldProps {
  label: string;
  values: unknown[];
  description?: string;
  renderItem?: (item: unknown, index: number) => React.ReactNode;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
}

export function ArrayField({ label, values, description, renderItem, onAdd, onRemove }: ArrayFieldProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <button
          className="text-xs text-tn-text-muted flex items-center gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? "▾" : "▸"}</span>
          <span>
            {label} ({values.length})
          </span>
          {description && <FieldTooltip description={description} />}
        </button>
        {onAdd && (
          <button
            className="text-xs text-tn-accent hover:text-tn-accent/80"
            onClick={onAdd}
          >
            + Add
          </button>
        )}
      </div>
      {expanded && (
        <div className="flex flex-col gap-1 pl-3 border-l border-tn-border">
          {values.map((item, index) => (
            <div key={index} className="flex items-start gap-1">
              <div className="flex-1">
                {renderItem ? (
                  renderItem(item, index)
                ) : (
                  <span className="text-xs text-tn-text">{JSON.stringify(item)}</span>
                )}
              </div>
              {onRemove && (
                <button
                  className="text-xs text-red-400 hover:text-red-300 mt-0.5"
                  onClick={() => onRemove(index)}
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
