import { create } from "zustand";
import { useSelectionStore } from "./useSelectionStore";
import {
  annotationService,
  type AnnotationResponse,
} from "~/services/annotations";
import { userAuthStore } from "~/lib/auth";
import type { Annotation } from "~/data/mock-session-data";

const ANNOTATION_SAVE_DELAY_MS = 700;
const pendingAnnotationSaves = new Map<string, ReturnType<typeof setTimeout>>();

function getAnnotationSaveKey(videoId: string, annotationId: string): string {
  return `${videoId}:${annotationId}`;
}

function clearPendingAnnotationSave(videoId: string, annotationId: string) {
  const key = getAnnotationSaveKey(videoId, annotationId);
  const timer = pendingAnnotationSaves.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingAnnotationSaves.delete(key);
  }
}

function sortAnnotations(items: Annotation[]): Annotation[] {
  return [...items].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    if (a.endTime !== b.endTime) return a.endTime - b.endTime;
    return a.id.localeCompare(b.id);
  });
}

function getAnnotationAuthor(createdByUserId: string): string {
  const currentUserId = userAuthStore.getState().user?.id ?? null;
  return createdByUserId === currentUserId ? "You" : "Collaborator";
}

/** Converts an API annotation response to the local Annotation shape. */
function fromApi(res: AnnotationResponse): Annotation {
  return {
    id: res.annotationId,
    title: res.title,
    description: res.description,
    startTime: res.startTime,
    endTime: res.endTime ?? res.startTime,
    author: getAnnotationAuthor(res.createdByUserId),
    date: res.updatedByUserId ? "Edited" : "Created",
  };
}

function toDto(annotation: Annotation) {
  return {
    title: annotation.title,
    description: annotation.description,
    startTime: annotation.startTime,
    endTime: annotation.endTime,
  };
}

function scheduleAnnotationPersist(videoId: string, annotation: Annotation) {
  clearPendingAnnotationSave(videoId, annotation.id);

  const snapshot = toDto(annotation);
  const timer = setTimeout(() => {
    pendingAnnotationSaves.delete(getAnnotationSaveKey(videoId, annotation.id));
    void annotationService
      .update(videoId, annotation.id, snapshot)
      .catch((error) => console.error("Failed to persist annotation:", error));
  }, ANNOTATION_SAVE_DELAY_MS);

  pendingAnnotationSaves.set(getAnnotationSaveKey(videoId, annotation.id), timer);
}

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
        if (get().videoId !== videoId) return;
        set({ annotations: sortAnnotations(data.map(fromApi)) });
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    },

    setAnnotations: (annotations) => {
      set({ videoId: null, annotations: sortAnnotations(annotations) });
      useSelectionStore.getState().actions.clearSelection();
    },

    handleTitleChange: (id, next) => {
      get().actions.updateAnnotation(id, { title: next });
    },

    handleDescriptionChange: (id, next) => {
      get().actions.updateAnnotation(id, { description: next });
    },

    handleNewAnnotation: () => {
      const { videoId } = get();
      if (!videoId) return;

      const dto = {
        title: "",
        description: "",
        startTime: 0,
        endTime: 1,
      };

      annotationService
        .create(videoId, dto)
        .then((response) => {
          if (get().videoId !== videoId) return;

          const newAnnotation = fromApi(response);
          set((state) => ({
            annotations: sortAnnotations([newAnnotation, ...state.annotations]),
          }));
          useSelectionStore
            .getState()
            .actions.setSelection("annotation", response.annotationId);
        })
        .catch((error) => console.error("Failed to create annotation:", error));
    },

    updateAnnotation: (id, updates) => {
      const currentVideoId = get().videoId;

      set((state) => ({
        annotations: sortAnnotations(
          state.annotations.map((annotation) =>
            annotation.id === id ? { ...annotation, ...updates } : annotation,
          ),
        ),
      }));

      if (!currentVideoId) return;

      const updated = get().annotations.find((annotation) => annotation.id === id);
      if (updated) {
        scheduleAnnotationPersist(currentVideoId, updated);
      }
    },

    handleDeleteAnnotation: (id) => {
      const { videoId } = get();
      if (videoId) {
        clearPendingAnnotationSave(videoId, id);
      }

      set((state) => ({
        annotations: state.annotations.filter((annotation) => annotation.id !== id),
      }));

      const selectionStore = useSelectionStore.getState();
      if (
        selectionStore.selectedType === "annotation" &&
        selectionStore.selectedId === id
      ) {
        selectionStore.actions.clearSelection();
      }

      if (videoId) {
        void annotationService
          .delete(videoId, id)
          .catch((error) => console.error("Failed to delete annotation:", error));
      }
    },
  },
}));
