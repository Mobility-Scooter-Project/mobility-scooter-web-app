import { create } from "zustand";
import { type Chapter } from "~/data/mock-session-data";
import Placeholder from "~/assets/placeholder-thumbnail.png";
import { useSelectionStore } from "./useSelectionStore";
import { taskService, type VideoTaskEntry } from "~/services/tasks";

type ChapterStore = {
  chapters: Chapter[];
  activeViewId: string | null;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    loadChapters: (viewId: string, chapters: Chapter[]) => void;
    /** Fetches task detection results from the API and maps them to chapters. */
    loadChaptersFromApi: (viewId: string, videoId: string) => Promise<void>;
    handleNewChapter: () => void;
    handleDeleteChapter: (id: string) => void;
    updateChapter: (id: string, updates: Partial<Chapter>) => void;
  };
};

/** Converts an API task entry to the local Chapter shape. */
function taskToChapter(entry: VideoTaskEntry): Chapter {
  return {
    id: String(entry.taskNumber),
    thumbnailUrl: Placeholder,
    title: entry.task,
    timestamp: entry.timestamp,
    author: "AI",
    lastUpdated: "",
    score: entry.score,
    description: entry.note ?? "",
  };
}

/**
 * Manages video chapters, including CRUD operations, selection state,
 * and loading from the video tasks API.
 */
export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  activeViewId: null,

  actions: {
    setChapters: (chapters) => {
      set({ chapters });
      useSelectionStore.getState().actions.clearSelection();
    },

    /**
     * Replaces the current chapter list with those from the given view.
     *
     * @param viewId - The active view ID
     * @param chapters - Chapters belonging to the view
     */
    loadChapters: (viewId, chapters) => {
      set({ activeViewId: viewId, chapters });
    },

    loadChaptersFromApi: async (viewId, videoId) => {
      set({ activeViewId: viewId, chapters: [] });
      useSelectionStore.getState().actions.clearSelection();

      try {
        const tasks = await taskService.getAll(videoId);
        // Only apply if still on the same view.
        if (get().activeViewId !== viewId) return;
        set({ chapters: tasks.map(taskToChapter) });
      } catch (error) {
        console.error("Failed to load chapters from tasks:", error);
      }
    },

    handleNewChapter: () => {
      const { chapters } = get();
      const nextId =
        chapters.length > 0
          ? String(
              Math.max(...chapters.map((c) => Number(c.id) || 0)) + 1,
            )
          : "1";

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const newItem: Chapter = {
        id: nextId,
        thumbnailUrl: Placeholder,
        title: "",
        timestamp: 0,
        author: "User",
        lastUpdated: `Last Updated ${dateStr}`,
        score: null,
        description: "",
      };

      set({ chapters: [newItem, ...chapters] });
      useSelectionStore.getState().actions.setSelection("chapter", nextId);
    },

    handleDeleteChapter: (id) => {
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
      }));

      const selectionStore = useSelectionStore.getState();
      if (
        selectionStore.selectedType === "chapter" &&
        selectionStore.selectedId === id
      ) {
        selectionStore.actions.clearSelection();
      }
    },

    updateChapter: (chapterId, updates) => {
      set((state) => ({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, ...updates } : ch,
        ),
      }));
    },
  },
}));
