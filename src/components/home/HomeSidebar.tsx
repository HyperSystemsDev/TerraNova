import { Home, LayoutGrid, Clock, Plus, FolderOpen } from "lucide-react";

export type SidebarTab = "home" | "templates" | "recent";

interface HomeSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onNewProject: () => void;
  onOpenProject: () => void;
}

const TABS: { id: SidebarTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "templates", label: "Templates", icon: LayoutGrid },
  { id: "recent", label: "Recent", icon: Clock },
];

export function HomeSidebar({
  activeTab,
  onTabChange,
  onNewProject,
  onOpenProject,
}: HomeSidebarProps) {
  return (
    <div className="w-[200px] shrink-0 bg-tn-surface border-r border-tn-border flex flex-col">
      {/* Logo area */}
      <div className="px-4 py-5 border-b border-tn-border">
        <h1 className="text-sm font-bold text-tn-text tracking-wide">
          TerraNova
        </h1>
        <p className="text-[10px] text-tn-text-muted mt-0.5">
          World Generation Studio
        </p>
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              activeTab === id
                ? "bg-tn-accent/15 text-tn-accent font-medium"
                : "text-tn-text-muted hover:bg-tn-bg hover:text-tn-text"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-tn-border flex flex-col gap-2">
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-tn-accent text-tn-bg hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          New Project
          <span className="ml-auto text-[10px] opacity-60">⌘N</span>
        </button>
        <button
          onClick={onOpenProject}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-tn-border text-tn-text-muted hover:bg-tn-bg hover:text-tn-text transition-colors"
        >
          <FolderOpen size={15} />
          Open
          <span className="ml-auto text-[10px] opacity-60">⌘O</span>
        </button>
      </div>
    </div>
  );
}
