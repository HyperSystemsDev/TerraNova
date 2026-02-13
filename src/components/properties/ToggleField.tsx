import { FieldTooltip } from "./FieldTooltip";

interface ToggleFieldProps {
  label: string;
  value: boolean;
  description?: string;
  onChange: (value: boolean) => void;
}

export function ToggleField({ label, value, description, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-tn-text-muted flex items-center">
        {label}
        {description && <FieldTooltip description={description} />}
      </label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          value ? "bg-tn-accent" : "bg-tn-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : ""
          }`}
        />
      </button>
    </div>
  );
}
