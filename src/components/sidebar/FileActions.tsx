import { useProjectStore } from "@/stores/projectStore";

export function FileActions() {
  const projectPath = useProjectStore((s) => s.projectPath);

  if (!projectPath) return null;

  // Show just the last folder name from the project path
  const projectName = projectPath.split(/[/\\]/).filter(Boolean).pop() ?? "Assets";

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-tn-border">
      <svg className="w-3.5 h-3.5 shrink-0 text-tn-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 2.5a1 1 0 011-1h3.586a1 1 0 01.707.293L8.707 3.207a1 1 0 00.707.293H13a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5z" />
      </svg>
      <span className="text-xs font-semibold text-tn-text truncate">
        {projectName}
      </span>
    </div>
  );
}
