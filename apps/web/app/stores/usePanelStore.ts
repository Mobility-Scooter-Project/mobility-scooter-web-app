import { create } from "zustand";

type PanelTab =
  | "analysis"
  | "chapters"
  | "points"
  | "annotations"
  | "comments"
  | "logs";

interface PanelState {
  activeTab: PanelTab;
  setActiveTab: (tab: PanelTab) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activeTab: "analysis", // Default tab
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
