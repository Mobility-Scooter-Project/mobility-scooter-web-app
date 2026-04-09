import { create } from "zustand";
import { useSelectionStore } from "./useSelectionStore";
import {
  annotationService,
  type AnnotationResponse,
} from "~/services/annotations";

type Annotation = {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  author: string;
  date: string;
  description: string;
};

type AnnotationStore = {
  /** The videoId annotations are currently scoped to. */
  videoId: string | null;
  annotations: Annotation[];

  actions: {
    /**
     * Loads annotations from the API for a given video.
     * Replaces the local list and updates the scoped videoId.
     */
    loadAnnotations: (videoId: string) => Promise<void>;
    /** Replaces the annotation list directly (e.g. for clearing). */
    setAnnotations: (annotations: Annotation[]) => void;
    /** Creates a new annotation locally and persists it to the API. */
    handleNewAnnotation: () => void;
    /** Deletes an annotation locally and from the API. */
    handleDeleteAnnotation: (id: string) => void;
    handleTitleChange: (id: string, next: string) => void;
    handleDescriptionChange: (id: string, next: string) => void;
    /** Updates annotation fields locally and persists the full record to the API. */
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  };
};

/** Converts an API annotation response to the local Annotation shape. */
function fromApi(res: AnnotationResponse): Annotation {
  return {
    id: res.annotationId,
    title: res.title,
    description: res.description,
    startTime: res.startTime,
    endTime: res.endTime ?? res.startTime,
    author: "",
    date: "",
  };
}

/**
 * Persists the current state of an annotation to the API.
 * Fires in the background — errors are logged but don't block the UI.
 */
function persistAnnotation(videoId: string | null, annotation: Annotation) {
  if (!videoId) return;
  annotationService
    .update(videoId, annotation.id, {
      title: annotation.title,
      description: annotation.description,
      startTime: annotation.startTime,
      endTime: annotation.endTime,
    })
    .catch((err) => console.error("Failed to persist annotation:", err));
}

/**
 * Manages video annotations, including creation, editing, deletion,
 * and synchronization with the backend API.
 */
export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  videoId: null,
  annotations: [],

  actions: {
    loadAnnotations: async (videoId) => {
      set({ videoId, annotations: [] });
      useSelectionStore.getState().actions.clearSelection();

      try {
        const data = await annotationService.getAll(videoId);
        // Only apply if we're still on the same video.
        if (get().videoId !== videoId) return;
        set({ annotations: data.map(fromApi) });
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    },

    setAnnotations: (annotations) => {
      set({ annotations });
      useSelectionStore.getState().actions.clearSelection();
    },

    handleTitleChange: (id, next) => {
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === id ? { ...a, title: next } : a,
        ),
      }));
    },

    handleDescriptionChange: (id, next) => {
      set((state) => ({
        annotations: state.annotations.map((a) =>
          a.id === id ? { ...a, description: next } : a,
        ),
      }));
    },

    handleNewAnnotation: () => {
      const { videoId } = get();
      if (!videoId) return;

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const dto = {
        title: "",
        description: "",
        startTime: 0,
        endTime: 1,
      };

      // Create on the API, then insert locally with the real ID.
      annotationService
        .create(videoId, dto)
        .then((res) => {
          // Only insert if still on the same video.
          if (get().videoId !== videoId) return;

          const newAnnotation: Annotation = {
            id: res.annotationId,
            ...dto,
            endTime: dto.endTime,
            author: "",
            date: dateStr,
          };

          set((state) => ({
            annotations: [newAnnotation, ...state.annotations],
          }));
          useSelectionStore
            .getState()
            .actions.setSelection("annotation", res.annotationId);
        })
        .catch((err) => console.error("Failed to create annotation:", err));
    },

    updateAnnotation: (id, updates) => {
      set((state) => ({
        annotations: state.annotations.map((ann) =>
          ann.id === id ? { ...ann, ...updates } : ann,
        ),
      }));

      // Persist the merged annotation.
      const updated = get().annotations.find((a) => a.id === id);
      if (updated) persistAnnotation(get().videoId, updated);
    },

    handleDeleteAnnotation: (id) => {
      const { videoId } = get();

      set((state) => ({
        annotations: state.annotations.filter((a) => a.id !== id),
      }));

      const selectionStore = useSelectionStore.getState();
      if (
        selectionStore.selectedType === "annotation" &&
        selectionStore.selectedId === id
      ) {
        selectionStore.actions.clearSelection();
      }

      if (videoId) {
        annotationService
          .delete(videoId, id)
          .catch((err) => console.error("Failed to delete annotation:", err));
      }
    },
  },
}));
