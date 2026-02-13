import { create } from "zustand";

export interface TemplateInfo {
  name: string;
  description: string;
  version: string;
  serverVersion: string;
  category: string;
  path: string;
  isBundled: boolean;
}

interface TemplateState {
  templates: TemplateInfo[];
  selectedTemplate: TemplateInfo | null;
  isLoading: boolean;
  activeTab: "bundled" | "community";

  // Actions
  setTemplates: (templates: TemplateInfo[]) => void;
  setSelectedTemplate: (template: TemplateInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: "bundled" | "community") => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  activeTab: "bundled",

  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
