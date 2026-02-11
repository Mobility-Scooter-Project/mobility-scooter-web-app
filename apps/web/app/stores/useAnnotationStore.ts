import { create } from "zustand";
import { MOCK_SESSIONS } from "~/data/mock-session-data";

type Annotation = {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  author: string;
  date: string;
  description: string;
};

type AnnotationStore = {
  annotations: Annotation[];
  selectedId: number | null;

  actions: {
    setAnnotations: (annotations: Annotation[]) => void;
    handleSelect: (id: number) => void;
    handleDeselect: () => void;
    handleTitleChange: (id: number, next: string) => void;
    handleDescriptionChange: (id: number, next: string) => void;
    handleNewAnnotation: () => void;
    updateAnnotation: (id: number, updates: Partial<Annotation>) => void;
    handleDeleteAnnotation: (id: number) => void; // Added
  };
};

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: MOCK_SESSIONS[0]?.views[0]?.annotations ?? [],
  selectedId: null,

  actions: {
    setAnnotations: (annotations) => set({ annotations, selectedId: null }),

    handleSelect: (id) =>
      set((state) => ({
        selectedId: state.selectedId === id ? null : id,
      })),

    handleDeselect: () => set({ selectedId: null }),

    handleTitleChange: (id, next) =>
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === id ? { ...a, title: next } : a
        ),
      })),

    handleDescriptionChange: (id, next) =>
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === id ? { ...a, description: next } : a
        ),
      })),

    handleNewAnnotation: () => {
      const { annotations } = get();
      const nextId = annotations.length
        ? Math.max(...annotations.map((a) => a.id)) + 1
        : 1;

      const newItem: Annotation = {
        id: nextId,
        title: "",
        startTime: 0,
        endTime: 0,
        author: "Garrett Lo",
        date: `${new Date()
          .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
          .replace(",", "")}`,
        description: "",
      };

      set((state) => ({
        annotations: [newItem, ...state.annotations],
        selectedId: nextId,
      }));
    },
    
    updateAnnotation: (id, updates) =>
      set((state) => ({
        annotations: state.annotations.map((ann) =>
          ann.id === id ? { ...ann, ...updates } : ann
        ),
      })),

    // New delete action
    handleDeleteAnnotation: (id) =>
      set((state) => ({
        annotations: state.annotations.filter((a) => a.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      })),
  },
}));