import { db, delay } from "./mock-db";
import type { Chapter } from "~/data/mock-session-data";

export const chapterService = {
  // GET chapters by Session ID AND View ID to ensure correct data
  getByViewId: async (sessionId: number, viewId: string) => {
    await delay();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (session) {
      const view = session.views.find((v) => v.id === viewId);
      if (view) {
        console.log(`[ChapterService] Retrieved ${view.chapters.length} chapters for Session ${sessionId}, View ${viewId}`);
        return [...view.chapters];
      }
    }
    console.warn(`[ChapterService] No view found for Session ${sessionId}, View ${viewId}`);
    return [];
  },

  update: async (viewId: string, chapterId: number, updates: Partial<Chapter>) => {
    await delay();
    // For updates, we iterate to find the specific chapter instance
    // In a real API, this would likely be by chapter ID directly
    for (const session of db.sessions) {
      const view = session.views.find((v) => v.id === viewId);
      if (view) {
        const chapter = view.chapters.find((c) => c.id === chapterId);
        if (chapter) {
          Object.assign(chapter, updates);
          db.commit();
          return { ...chapter };
        }
      }
    }
    throw new Error("Chapter not found");
  },

  create: async (viewId: string, chapter: Chapter) => {
    await delay();
    for (const session of db.sessions) {
      const view = session.views.find((v) => v.id === viewId);
      if (view) {
        view.chapters.unshift(chapter);
        db.commit();
        return { ...chapter };
      }
    }
    throw new Error("View not found");
  },
};