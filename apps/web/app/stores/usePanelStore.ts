import { create } from "zustand";

type PanelTab = "chapters" | "points" | "annotations";

interface PanelState {
  activeTab: PanelTab;
  setActiveTab: (tab: PanelTab) => void;
}

/**
 * Controls the global state of the side panel tabs (Chapters, Points, Annotations).
 */
export const usePanelStore = create<PanelState>((set) => ({
  activeTab: "chapters", // default tab
  setActiveTab: (tab) => set({ activeTab: tab }),
}));