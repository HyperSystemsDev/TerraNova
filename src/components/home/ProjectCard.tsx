import { useState } from "react";
import { FileJson, Trash2, FolderOpen, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/utils/timeHelpers";
import type { RecentProject } from "@/stores/recentProjectsStore";

interface ProjectCardProps {
  project: RecentProject;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
}

export function ProjectCard({ project, onOpen, onRemove }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  function truncatePath(path: string, maxLen = 50): string {
    if (path.length <= maxLen) return path;
    return "\u2026" + path.slice(path.length - maxLen + 1);
  }

  return (
    <div
      className="group relative bg-tn-panel border border-tn-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:border-tn-accent/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-tn-accent/5"
      onClick={() => onOpen(project.path)}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Accent left edge */}
      <div className="flex">
        <div className="w-1 shrink-0 bg-tn-accent/40 group-hover:bg-tn-accent transition-colors" />

        <div className="flex-1 p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-lg bg-tn-accent/10 flex items-center justify-center text-tn-accent group-hover:bg-tn-accent/20 transition-colors">
              <FileJson size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-tn-text truncate">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-tn-text-muted">
                  {formatRelativeTime(project.lastOpened)}
                </p>
                {project.template && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-tn-accent/10 text-tn-accent/80">
                    {project.template}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-tn-text-muted/50 mt-2 truncate font-mono">
                {truncatePath(project.path)}
              </p>
            </div>

            {/* Open arrow on hover */}
            <div className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-tn-text-muted opacity-0 group-hover:opacity-100 group-hover:text-tn-accent transition-all">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div className="absolute right-2 top-2 z-50 bg-tn-panel border border-tn-border rounded shadow-lg py-1 min-w-[160px]">
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-tn-accent/20 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(project.path);
                setShowMenu(false);
              }}
            >
              <FolderOpen size={14} />
              Open
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(project.path);
                setShowMenu(false);
              }}
            >
              <Trash2 size={14} />
              Remove from Recent
            </button>
          </div>
        </>
      )}
    </div>
  );
}
