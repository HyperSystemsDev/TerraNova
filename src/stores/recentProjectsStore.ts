import { create } from "zustand";

const STORAGE_KEY = "tn-recent-projects";
const MAX_RECENT = 12;

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
  template?: string;
}

interface RecentProjectsState {
  projects: RecentProject[];
  addProject: (path: string, template?: string) => void;
  removeProject: (path: string) => void;
  clearAll: () => void;
}

function loadFromStorage(): RecentProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(projects: RecentProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function extractName(path: string): string {
  const segments = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return segments[segments.length - 1] || path;
}

export const useRecentProjectsStore = create<RecentProjectsState>((set, get) => ({
  projects: loadFromStorage(),

  addProject: (path, template) => {
    const existing = get().projects.filter((p) => p.path !== path);
    const updated = [
      { name: extractName(path), path, lastOpened: Date.now(), template },
      ...existing,
    ].slice(0, MAX_RECENT);
    set({ projects: updated });
    saveToStorage(updated);
  },

  removeProject: (path) => {
    const updated = get().projects.filter((p) => p.path !== path);
    set({ projects: updated });
    saveToStorage(updated);
  },

  clearAll: () => {
    set({ projects: [] });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
