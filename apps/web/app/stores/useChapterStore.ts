import { create } from "zustand";
import { type Chapter } from "~/data/mock-session-data";
import { chapterService } from "~/services/chapters";
import Placeholder from "~/assets/placeholder-thumbnail.png";
import { useSelectionStore } from "./useSelectionStore";

type ChapterStore = {
  chapters: Chapter[];
  activeViewId: string | null;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    loadChapters: (sessionId: number, viewId: string) => Promise<void>;
    handleNewChapter: () => Promise<void>;
    handleDeleteChapter: (id: number) => void;
    updateChapter: (id: number, updates: Partial<Chapter>) => Promise<void>;
  };
};

/**
 * Manages video chapters, including CRUD operations, selection state, and backend synchronization.
 */
export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  activeViewId: null,

  actions: {
    setChapters: (chapters) => {
      set({ chapters });
      useSelectionStore.getState().actions.clearSelection();
    },

    loadChapters: async (sessionId, viewId) => {
      set({ activeViewId: viewId });
      const data = await chapterService.getByViewId(sessionId, viewId);
      set({ chapters: data });
    },

    handleNewChapter: async () => {
      const { activeViewId, chapters } = get();
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

      if (activeViewId) await chapterService.create(activeViewId, newItem);
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

    updateChapter: async (chapterId, updates) => {
      const { activeViewId, chapters } = get();
      set({
        chapters: chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, ...updates } : ch,
        ),
      });

      if (activeViewId) {
        await chapterService.update(activeViewId, chapterId, updates);
      }
    },
  },
}));