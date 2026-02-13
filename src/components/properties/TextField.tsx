import { FieldTooltip } from "./FieldTooltip";

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  description?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function TextField({ label, value, placeholder, description, onChange, onBlur }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-tn-text-muted flex items-center">
        {label}
        {description && <FieldTooltip description={description} />}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="px-2 py-1 text-sm bg-tn-bg border border-tn-border rounded"
      />
    </div>
  );
}
