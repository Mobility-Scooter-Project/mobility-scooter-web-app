import { create } from "zustand";

type PanelTab =
  | "chapters"
  | "points"
  | "annotations"

interface PanelState {
  activeTab: PanelTab;
  setActiveTab: (tab: PanelTab) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activeTab: "chapters", // Default tab
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
