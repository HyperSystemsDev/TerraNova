import { Mountain, TreePine, FileJson, Sparkles } from "lucide-react";
import type { TemplateInfo } from "@/data/templates";

// const CATEGORY_COLORS: Record<string, string> = {
//   Starter: "bg-node-density",
//   Nature: "bg-node-position",
//   Fantasy: "bg-node-curve",
// };

const CATEGORY_HEX: Record<string, string> = {
  Starter: "#3b82f6",
  Nature: "#22c55e",
  Fantasy: "#a855f7",
};

const CATEGORY_ICONS: Record<string, typeof Mountain> = {
  Starter: FileJson,
  Nature: TreePine,
  Fantasy: Sparkles,
};

interface TemplateCardProps {
  template: TemplateInfo;
  onClick: () => void;
  compact?: boolean;
}

export function TemplateCard({
  template,
  onClick,
  compact,
}: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category] ?? Mountain;
  const hex = CATEGORY_HEX[template.category] ?? "#00d4aa";

  if (compact) {
    return (
      <button
        className="group text-left bg-tn-panel border border-tn-border rounded-lg overflow-hidden transition-all duration-200 hover:border-tn-accent/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-tn-accent/5"
        onClick={onClick}
      >
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${hex}12, transparent)`,
          }}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200"
            style={{ backgroundColor: `${hex}20` }}
          >
            <Icon size={16} style={{ color: hex }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-tn-text truncate">
              {template.displayName}
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-tn-text-muted/60">
              {template.category}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      className="group text-left bg-tn-panel border border-tn-border rounded-lg overflow-hidden transition-all duration-200 hover:border-tn-accent/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-tn-accent/5 flex flex-col h-full"
      onClick={onClick}
    >
      {/* Gradient header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{
          background: `linear-gradient(to bottom, ${hex}15, transparent)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-tn-text-muted group-hover:scale-110 transition-transform duration-200"
            style={{ backgroundColor: `${hex}20` }}
          >
            <Icon size={20} style={{ color: hex }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-tn-text">
              {template.displayName}
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-tn-text-muted/70">
              {template.category}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col flex-1">
        <p className="text-xs text-tn-text-muted leading-relaxed line-clamp-2">
          {template.description}
        </p>

        {/* Tag pills */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-tn-bg text-tn-text-muted border border-tn-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
