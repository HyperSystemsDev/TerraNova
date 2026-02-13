interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPickerField({ label, value, onChange }: ColorPickerFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-tn-text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-tn-border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-sm bg-tn-bg border border-tn-border rounded font-mono"
        />
      </div>
    </div>
  );
}
