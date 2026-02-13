import { useTemplateStore } from "@/stores/templateStore";
import { TemplateCard } from "./TemplateCard";

export function TemplateBrowser() {
  const templates = useTemplateStore((s) => s.templates);
  const activeTab = useTemplateStore((s) => s.activeTab);
  const setActiveTab = useTemplateStore((s) => s.setActiveTab);
  const setSelectedTemplate = useTemplateStore((s) => s.setSelectedTemplate);

  const filtered = templates.filter((t) =>
    activeTab === "bundled" ? t.isBundled : !t.isBundled,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-tn-border">
        <button
          onClick={() => setActiveTab("bundled")}
          className={`px-4 py-2 text-sm ${
            activeTab === "bundled"
              ? "border-b-2 border-tn-accent text-tn-accent"
              : "text-tn-text-muted"
          }`}
        >
          Bundled
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`px-4 py-2 text-sm ${
            activeTab === "community"
              ? "border-b-2 border-tn-accent text-tn-accent"
              : "text-tn-text-muted"
          }`}
        >
          Community
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
        {filtered.map((template) => (
          <TemplateCard
            key={template.name}
            template={template}
            onClick={() => setSelectedTemplate(template)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-tn-text-muted py-8">
            No templates available
          </p>
        )}
      </div>
    </div>
  );
}
