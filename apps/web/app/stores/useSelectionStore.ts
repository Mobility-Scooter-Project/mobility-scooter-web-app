import { create } from "zustand";

export type SelectionType = "chapter" | "annotation" | "point" | null;

export type SelectionStore = {
  selectedId: number | null;
  selectedType: SelectionType;
  actions: {
    setSelection: (type: SelectionType, id: number) => void;
    clearSelection: () => void;
  };
};

/**
 * Centralized store for managing mutually exclusive global selection state 
 * across different analysis panel tabs.
 */
export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedId: null,
  selectedType: null,

  actions: {
    setSelection: (type, id) =>
      set((state) => {
        // If the user clicks the currently active item, toggle it off
        if (state.selectedType === type && state.selectedId === id) {
          return { selectedId: null, selectedType: null };
        }
        // Otherwise, set the new selection globally
        return { selectedType: type, selectedId: id };
      }),
      
    clearSelection: () => set({ selectedId: null, selectedType: null }),
  },
}));