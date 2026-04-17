import { create } from "zustand";
import { type Chapter } from "~/data/mock-session-data";
import Placeholder from "~/assets/placeholder-thumbnail.png";
import { useSelectionStore } from "./useSelectionStore";
import { taskService, type VideoTaskEntry } from "~/services/tasks";
import { userAuthStore } from "~/lib/auth";
import { sortChaptersByStartTime } from "~/lib/analysis-panel-sorting";

const CHAPTER_SAVE_DELAY_MS = 700;
const pendingChapterSaves = new Map<string, ReturnType<typeof setTimeout>>();

/** Task-detection processing status as tracked by the video-worker. */
export type TaskStatus =
  | "unknown"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

function getChapterSaveKey(videoId: string, chapterId: string): string {
  return `${videoId}:${chapterId}`;
}

function clearPendingChapterSave(videoId: string, chapterId: string) {
  const key = getChapterSaveKey(videoId, chapterId);
  const timer = pendingChapterSaves.get(key);
  if (timer) {
    clearTimeout(timer);
    pendingChapterSaves.delete(key);
  }
}

function getChapterAuthor(entry: VideoTaskEntry): string {
  if (!entry.createdByUserId) return "AI";

  const currentUserId = userAuthStore.getState().user?.id ?? null;
  return entry.createdByUserId === currentUserId ? "You" : "Collaborator";
}

function getChapterLastUpdated(entry: VideoTaskEntry): string {
  if (entry.updatedByUserId) return "Edited";
  if (entry.createdByUserId) return "Created";
  return "Detected";
}

/** Converts an API task entry to the local Chapter shape. */
function taskToChapter(entry: VideoTaskEntry): Chapter {
  return {
    id: entry.taskId,
    thumbnailUrl: Placeholder,
    title: entry.task,
    timestamp: entry.timestamp,
    author: getChapterAuthor(entry),
    lastUpdated: getChapterLastUpdated(entry),
    score: entry.score,
    description: entry.note ?? "",
  };
}

function toTaskDto(chapter: Chapter) {
  return {
    timestamp: chapter.timestamp,
    task: chapter.title,
    note: chapter.description,
    score: chapter.score,
  };
}

function scheduleChapterPersist(videoId: string, chapter: Chapter) {
  clearPendingChapterSave(videoId, chapter.id);

  const snapshot = toTaskDto(chapter);
  const timer = setTimeout(() => {
    pendingChapterSaves.delete(getChapterSaveKey(videoId, chapter.id));
    void taskService
      .update(videoId, chapter.id, snapshot)
      .catch((error) => console.error("Failed to persist chapter:", error));
  }, CHAPTER_SAVE_DELAY_MS);

  pendingChapterSaves.set(getChapterSaveKey(videoId, chapter.id), timer);
}

type ChapterStore = {
  chapters: Chapter[];
  activeViewId: string | null;
  videoId: string | null;
  /** Current task-detection processing status for the active video. */
  taskStatus: TaskStatus;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    loadChapters: (viewId: string, chapters: Chapter[]) => void;
    /** Fetches task detection results from the API and maps them to chapters. */
    loadChaptersFromApi: (viewId: string, videoId: string) => Promise<void>;
    handleNewChapter: () => void;
    handleDeleteChapter: (id: string) => void;
    updateChapter: (id: string, updates: Partial<Chapter>) => void;
    /** Updates the task-detection processing status. */
    setTaskStatus: (status: TaskStatus) => void;
  };
};

/**
 * Manages video chapters, including CRUD operations, selection state,
 * and loading from the video tasks API.
 */
export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  activeViewId: null,
  videoId: null,
  taskStatus: "unknown",

  actions: {
    setChapters: (chapters) => {
      set({ chapters: sortChaptersByStartTime(chapters) });
      useSelectionStore.getState().actions.clearSelection();
    },

    /**
     * Replaces the current chapter list with those from the given view.
     */
    loadChapters: (viewId, chapters) => {
      set({
        activeViewId: viewId,
        videoId: null,
        chapters: sortChaptersByStartTime(chapters),
      });
    },

    loadChaptersFromApi: async (viewId, videoId) => {
      set({ activeViewId: viewId, videoId, chapters: [] });
      useSelectionStore.getState().actions.clearSelection();

      try {
        const tasks = await taskService.getAll(videoId);
        if (get().activeViewId !== viewId || get().videoId !== videoId) return;
        set({ chapters: sortChaptersByStartTime(tasks.map(taskToChapter)) });
      } catch (error) {
        console.error("Failed to load chapters from tasks:", error);
      }
    },

    handleNewChapter: () => {
      const { videoId } = get();
      if (!videoId) return;

      taskService
        .create(videoId, {
          timestamp: 0,
          task: "",
          note: "",
          score: null,
        })
        .then((entry) => {
          if (get().videoId !== videoId) return;

          const chapter = taskToChapter(entry);
          set((state) => ({
            chapters: sortChaptersByStartTime([chapter, ...state.chapters]),
          }));
          useSelectionStore
            .getState()
            .actions.setSelection("chapter", entry.taskId);
        })
        .catch((error) => console.error("Failed to create chapter:", error));
    },

    handleDeleteChapter: (id) => {
      const { videoId } = get();
      if (videoId) {
        clearPendingChapterSave(videoId, id);
      }

      set((state) => ({
        chapters: state.chapters.filter((chapter) => chapter.id !== id),
      }));

      const selectionStore = useSelectionStore.getState();
      if (
        selectionStore.selectedType === "chapter" &&
        selectionStore.selectedId === id
      ) {
        selectionStore.actions.clearSelection();
      }

      if (videoId) {
        void taskService
          .delete(videoId, id)
          .catch((error) => console.error("Failed to delete chapter:", error));
      }
    },

    updateChapter: (chapterId, updates) => {
      const currentVideoId = get().videoId;

      set((state) => ({
        chapters: sortChaptersByStartTime(
          state.chapters.map((chapter) =>
            chapter.id === chapterId ? { ...chapter, ...updates } : chapter,
          ),
        ),
      }));

      if (!currentVideoId) return;

      const updated = get().chapters.find((chapter) => chapter.id === chapterId);
      if (updated) {
        scheduleChapterPersist(currentVideoId, updated);
      }
    },

    setTaskStatus: (status) => set({ taskStatus: status }),
  },
}));
