import { BUNDLED_TEMPLATES } from "@/data/templates";
import { TemplateCard } from "./TemplateCard";

interface TemplatesTabProps {
  onSelectTemplate: (templateName: string) => void;
}

export function TemplatesTab({ onSelectTemplate }: TemplatesTabProps) {
  // Group templates by category
  const categories = new Map<string, typeof BUNDLED_TEMPLATES>();
  for (const t of BUNDLED_TEMPLATES) {
    const list = categories.get(t.category) ?? [];
    list.push(t);
    categories.set(t.category, list);
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h2 className="text-lg font-semibold text-tn-text mb-6">Templates</h2>

      {[...categories.entries()].map(([category, templates]) => (
        <section key={category} className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-tn-text-muted mb-3">
            {category}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.name}
                template={t}
                onClick={() => onSelectTemplate(t.name)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
