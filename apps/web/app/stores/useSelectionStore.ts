import { create } from "zustand";

export type SelectionType = "chapter" | "annotation" | "point" | null;

export type SelectionStore = {
  selectedId: string | null;
  selectedType: SelectionType;
  actions: {
    setSelection: (type: SelectionType, id: string) => void;
    selectSelection: (type: SelectionType, id: string) => void;
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
        if (state.selectedType === type && state.selectedId === id) {
          return { selectedId: null, selectedType: null };
        }

        return { selectedType: type, selectedId: id };
      }),

    selectSelection: (type, id) =>
      set({
        selectedType: type,
        selectedId: id,
      }),

    clearSelection: () => set({ selectedId: null, selectedType: null }),
  },
}));
