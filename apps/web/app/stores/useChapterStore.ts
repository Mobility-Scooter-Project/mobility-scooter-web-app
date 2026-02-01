import { create } from "zustand";
import { type Chapter, MOCK_SESSIONS } from "~/data/mock-session-data";
import Placeholder from "~/assets/placeholder-thumbnail.png";

type ChapterStore = {
  chapters: Chapter[];
  selectedId: number | null;

  actions: {
    setChapters: (chapters: Chapter[]) => void;
    handleSelect: (id: number) => void;
    handleDeselect: () => void;
    handleScoreChange: (chapterId: number, newScore: number) => void;
    handleTitleChange: (chapterId: number, next: string) => void;
    handleDescriptionChange: (chapterId: number, next: string) => void;
    handleNewChapter: () => void;
  };
};

export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: MOCK_SESSIONS[0]?.views[0]?.chapters || [],
  selectedId: null,

  actions: {
    setChapters: (chapters) => set({ chapters, selectedId: null }),

    handleSelect: (id) => set({ selectedId: id }),
    
    handleDeselect: () => set({ selectedId: null }),

    handleScoreChange: (chapterId, newScore) =>
      set((state) => ({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId
            ? { ...ch, score: ch.score === newScore ? null : newScore }
            : ch
        ),
      })),

    handleTitleChange: (chapterId, next) =>
      set((state) => ({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, title: next } : ch
        ),
      })),

    handleDescriptionChange: (chapterId, next) =>
      set((state) => ({
        chapters: state.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, description: next } : ch
        ),
      })),

    handleNewChapter: () => {
      const { chapters } = get();
      const nextId = chapters.length
        ? Math.max(...chapters.map((c) => c.id)) + 1
        : 1;

      const dateStr = new Date()
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .replace(",", "");

      const newItem: Chapter = {
        id: nextId,
        thumbnailUrl: Placeholder,
        title: "",
        timestamp: "00:00",
        author: "Garrett Lo",
        lastUpdated: `Last Updated ${dateStr}`,
        score: null,
        description: "",
      };

      set((state) => ({
        chapters: [newItem, ...state.chapters],
        selectedId: nextId,
      }));
    },
  },
}));