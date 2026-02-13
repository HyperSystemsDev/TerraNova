import type { TemplateInfo } from "@/stores/templateStore";

interface TemplateCardProps {
  template: TemplateInfo;
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left p-4 rounded-lg border border-tn-border bg-tn-panel hover:border-tn-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold flex-1">{template.name}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-tn-accent/20 text-tn-accent">
          {template.category}
        </span>
      </div>
      <p className="text-xs text-tn-text-muted line-clamp-2">{template.description}</p>
      <div className="mt-2 text-[10px] text-tn-text-muted">
        v{template.version}
      </div>
    </button>
  );
}
