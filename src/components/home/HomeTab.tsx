import { useState, useEffect } from "react";
import { ArrowRight, Mountain } from "lucide-react";
import { BUNDLED_TEMPLATES } from "@/data/templates";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { TemplateCard } from "./TemplateCard";
import { ProjectCard } from "./ProjectCard";

function useQuickStartCount() {
  const [count, setCount] = useState(() =>
    window.innerWidth >= 1400 ? 5 : window.innerWidth >= 1100 ? 4 : 3,
  );

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      setCount(w >= 1400 ? 5 : w >= 1100 ? 4 : 3);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return count;
}

interface HomeTabProps {
  onOpenProject: (path: string) => void;
  onRemoveProject: (path: string) => void;
  onSelectTemplate: (templateName: string) => void;
  onSwitchTab: (tab: string) => void;
}

export function HomeTab({
  onOpenProject,
  onRemoveProject,
  onSelectTemplate,
  onSwitchTab,
}: HomeTabProps) {
  const quickStartCount = useQuickStartCount();
  const quickStartTemplates = BUNDLED_TEMPLATES.slice(0, quickStartCount);
  const projects = useRecentProjectsStore((s) => s.projects);
  const recentSlice = projects.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Quick Start */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-tn-text-muted">
            Quick Start
          </h2>
          <button
            className="text-xs text-tn-text-muted hover:text-tn-accent flex items-center gap-1 transition-colors"
            onClick={() => onSwitchTab("templates")}
          >
            All templates <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {quickStartTemplates.map((t) => (
            <TemplateCard
              key={t.name}
              template={t}
              compact
              onClick={() => onSelectTemplate(t.name)}
            />
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-tn-text">
            Recent Projects
          </h2>
          {projects.length > 6 && (
            <button
              className="text-xs text-tn-text-muted hover:text-tn-accent flex items-center gap-1 transition-colors"
              onClick={() => onSwitchTab("recent")}
            >
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {recentSlice.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3">
            {recentSlice.map((p) => (
              <ProjectCard
                key={p.path}
                project={p}
                onOpen={onOpenProject}
                onRemove={onRemoveProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-tn-surface flex items-center justify-center mb-4">
              <Mountain size={24} className="text-tn-text-muted" />
            </div>
            <h3 className="text-sm font-medium text-tn-text mb-1">
              Welcome to TerraNova
            </h3>
            <p className="text-xs text-tn-text-muted max-w-[280px]">
              Create your first world from a template above, or open an existing
              asset pack to get started.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
