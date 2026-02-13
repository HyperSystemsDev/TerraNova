import { FieldTooltip } from "./FieldTooltip";

interface SliderFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export function SliderField({ label, value, min = -100, max = 100, step = 0.01, description, onChange, onBlur }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-tn-text-muted flex items-center">
        {label}
        {description && <FieldTooltip description={description} />}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onBlur={onBlur}
          className="flex-1 accent-tn-accent"
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            if (Number.isNaN(raw)) return;
            onChange(Math.max(min, Math.min(max, raw)));
          }}
          onBlur={onBlur}
          className="w-20 px-1.5 py-0.5 text-xs bg-tn-bg border border-tn-border rounded text-right"
        />
      </div>
    </div>
  );
}
