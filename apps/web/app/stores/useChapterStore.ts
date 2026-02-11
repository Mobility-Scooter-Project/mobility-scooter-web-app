import { create } from "zustand";
import { type Chapter } from "~/data/mock-session-data";
import { chapterService } from "~/services/chapters";
import Placeholder from "~/assets/placeholder-thumbnail.png";

type ChapterStore = {
  chapters: Chapter[];
  selectedId: number | null;
  activeViewId: string | null;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    loadChapters: (sessionId: number, viewId: string) => Promise<void>;
    handleSelect: (id: number) => void;
    handleDeselect: () => void;
    handleNewChapter: () => Promise<void>;
    handleDeleteChapter: (id: number) => void;
    handleScoreChange: (chapterId: number, newScore: number) => Promise<void>;
    handleTitleChange: (chapterId: number, next: string) => Promise<void>;
    handleDescriptionChange: (chapterId: number, next: string) => Promise<void>;
    handleTimestampChange: (chapterId: number, next: string) => Promise<void>;
  };
};

/**
 * Manages video chapters, including CRUD operations, selection state, and backend synchronization.
 */
export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  selectedId: null,
  activeViewId: null,

  actions: {
    setChapters: (chapters) => set({ chapters, selectedId: null }),

    loadChapters: async (sessionId, viewId) => {
      set({ activeViewId: viewId });
      const data = await chapterService.getByViewId(sessionId, viewId);
      set({ chapters: data });
    },

    handleSelect: (id) => set({ selectedId: id }),
    handleDeselect: () => set({ selectedId: null }),

    handleScoreChange: async (chapterId, newScore) => {
      const { activeViewId, chapters } = get();
      
      const updatedChapters = chapters.map((ch) =>
        ch.id === chapterId
          ? { ...ch, score: ch.score === newScore ? null : newScore }
          : ch
      );
      set({ chapters: updatedChapters });

      if (activeViewId) {
        await chapterService.update(activeViewId, chapterId, { score: newScore });
      }
    },

    handleTitleChange: async (chapterId, next) => {
      const { activeViewId, chapters } = get();
      set({ chapters: chapters.map((ch) => ch.id === chapterId ? { ...ch, title: next } : ch) });
      if (activeViewId) await chapterService.update(activeViewId, chapterId, { title: next });
    },

    handleDescriptionChange: async (chapterId, next) => {
      const { activeViewId, chapters } = get();
      set({ chapters: chapters.map((ch) => ch.id === chapterId ? { ...ch, description: next } : ch) });
      if (activeViewId) await chapterService.update(activeViewId, chapterId, { description: next });
    },

    handleTimestampChange: async (chapterId, next) => {
      const { activeViewId, chapters } = get();
      set({ chapters: chapters.map((ch) => ch.id === chapterId ? { ...ch, timestamp: next } : ch) });
      if (activeViewId) await chapterService.update(activeViewId, chapterId, { timestamp: next });
    },

    handleNewChapter: async () => {
      const { activeViewId, chapters } = get();
      const nextId = chapters.length ? Math.max(...chapters.map((c) => c.id)) + 1 : 1;

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

      const newItem: Chapter = {
        id: nextId,
        thumbnailUrl: Placeholder,
        title: "",
        timestamp: "00:00",
        author: "User",
        lastUpdated: `Last Updated ${dateStr}`,
        score: null,
        description: "",
      };

      set({ chapters: [newItem, ...chapters], selectedId: nextId });
      if (activeViewId) await chapterService.create(activeViewId, newItem);
    },

    handleDeleteChapter: (id) => {
      set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      }));
    },
  },
}));