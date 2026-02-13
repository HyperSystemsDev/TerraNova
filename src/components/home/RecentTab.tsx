import { useState } from "react";
import { Clock } from "lucide-react";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { ProjectCard } from "./ProjectCard";

interface RecentTabProps {
  onOpenProject: (path: string) => void;
}

type SortMode = "recent" | "name";

export function RecentTab({ onOpenProject }: RecentTabProps) {
  const projects = useRecentProjectsStore((s) => s.projects);
  const removeProject = useRecentProjectsStore((s) => s.removeProject);
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const sorted = [...projects].sort((a, b) => {
    if (sortMode === "name") return a.name.localeCompare(b.name);
    return b.lastOpened - a.lastOpened;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-tn-text">Recent Projects</h2>

        {projects.length > 0 && (
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-xs bg-tn-surface border border-tn-border rounded px-2 py-1 text-tn-text-muted outline-none focus:border-tn-accent"
          >
            <option value="recent">Sort: Recent</option>
            <option value="name">Sort: Name</option>
          </select>
        )}
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {sorted.map((p) => (
            <ProjectCard
              key={p.path}
              project={p}
              onOpen={onOpenProject}
              onRemove={removeProject}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-tn-surface flex items-center justify-center mb-4">
            <Clock size={24} className="text-tn-text-muted" />
          </div>
          <h3 className="text-sm font-medium text-tn-text mb-1">
            No recent projects
          </h3>
          <p className="text-xs text-tn-text-muted max-w-[240px]">
            Projects you open will appear here for quick access.
          </p>
        </div>
      )}
    </div>
  );
}
