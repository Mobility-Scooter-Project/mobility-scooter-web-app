import { create } from "zustand";
import { useSelectionStore } from "./useSelectionStore";

type Annotation = {
  id: number;
  title: string;
  startTime: number;
  endTime: number;
  author: string;
  date: string;
  description: string;
};

type AnnotationStore = {
  annotations: Annotation[];

  actions: {
    setAnnotations: (annotations: Annotation[]) => void;
    handleNewAnnotation: () => void;
    handleDeleteAnnotation: (id: number) => void;
    handleTitleChange: (id: number, next: string) => void;
    handleDescriptionChange: (id: number, next: string) => void;
    updateAnnotation: (id: number, updates: Partial<Annotation>) => void;
  };
};

/**
 * Manages video annotations, including creation, editing, and selection.
 */
export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: [],

  actions: {
    setAnnotations: (annotations) => {
      set({ annotations });
      useSelectionStore.getState().actions.clearSelection();
    },

    handleTitleChange: (id, next) => set((state) => ({
      annotations: state.annotations.map((a) => a.id === id ? { ...a, title: next } : a),
    })),

    handleDescriptionChange: (id, next) => set((state) => ({
      annotations: state.annotations.map((a) => a.id === id ? { ...a, description: next } : a),
    })),

    handleNewAnnotation: () => {
      const { annotations } = get();
      const nextId = annotations.length ? Math.max(...annotations.map((a) => a.id)) + 1 : 1;

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

      const newItem: Annotation = {
        id: nextId,
        title: "",
        startTime: 0,
        endTime: 1,
        author: "Garrett Lo",
        date: dateStr,
        description: "",
      };

      set({ annotations: [newItem, ...annotations] });
      useSelectionStore.getState().actions.setSelection("annotation", nextId);
    },
    
    updateAnnotation: (id, updates) => set((state) => ({
      annotations: state.annotations.map((ann) => ann.id === id ? { ...ann, ...updates } : ann),
    })),

    handleDeleteAnnotation: (id) => {
      set((state) => ({
        annotations: state.annotations.filter((a) => a.id !== id),
      }));
      
      const selectionStore = useSelectionStore.getState();
      if (selectionStore.selectedType === "annotation" && selectionStore.selectedId === id) {
        selectionStore.actions.clearSelection();
      }
    },
  },
}));