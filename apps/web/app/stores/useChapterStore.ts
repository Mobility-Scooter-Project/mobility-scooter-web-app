import { create } from "zustand";
import { type Chapter } from "~/data/mock-session-data";
import Placeholder from "~/assets/placeholder-thumbnail.png";
import { useSelectionStore } from "./useSelectionStore";

type ChapterStore = {
  chapters: Chapter[];
  activeViewId: string | null;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    loadChapters: (viewId: string, chapters: Chapter[]) => void;
    handleNewChapter: () => void;
    handleDeleteChapter: (id: number) => void;
    updateChapter: (id: number, updates: Partial<Chapter>) => void;
  };
};

/**
 * Manages video chapters, including CRUD operations and selection state.
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

    handleNewChapter: () => {
      const { chapters } = get();
      const nextId = chapters.length
        ? Math.max(...chapters.map((c) => c.id)) + 1
        : 1;

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
      if (selectionStore.selectedType === "chapter" && selectionStore.selectedId === id) {
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
