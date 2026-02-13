import { useTemplateStore, type TemplateInfo } from "@/stores/templateStore";
import { useTauriIO } from "@/hooks/useTauriIO";

interface TemplateDetailProps {
  template: TemplateInfo;
}

export function TemplateDetail({ template }: TemplateDetailProps) {
  const setSelectedTemplate = useTemplateStore((s) => s.setSelectedTemplate);
  const { createFromTemplate } = useTauriIO();

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedTemplate(null)}
          className="text-sm text-tn-text-muted hover:text-tn-text"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold flex-1">{template.name}</h2>
        <span className="text-xs px-2 py-1 rounded-full bg-tn-accent/20 text-tn-accent">
          {template.category}
        </span>
      </div>

      <p className="text-sm text-tn-text-muted">{template.description}</p>

      <div className="text-xs text-tn-text-muted space-y-1">
        <p>Version: {template.version}</p>
        <p>Server Version: {template.serverVersion}</p>
        <p>Source: {template.isBundled ? "Bundled" : "Community"}</p>
      </div>

      <button
        onClick={() => createFromTemplate(template.name)}
        className="mt-2 px-4 py-2 bg-tn-accent text-white rounded hover:bg-tn-accent/80 text-sm font-medium"
      >
        Create Project from Template
      </button>
    </div>
  );
}
