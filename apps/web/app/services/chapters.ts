import { db, delay } from "./mock-db";
import type { Chapter } from "~/data/mock-session-data";

export const chapterService = {
  /**
   * GET /sessions/:sessionId/views/:viewId/chapters
   * Fetches chapters specific to a view within a session.
   */
  getByViewId: async (sessionId: number, viewId: string) => {
    await delay();
    const session = db.sessions.find((s) => s.id === sessionId);
    const view = session?.views.find((v) => v.id === viewId);
    return view ? [...view.chapters] : [];
  },

  /**
   * PATCH /views/:viewId/chapters/:chapterId
   * Updates a specific chapter.
   */
  update: async (viewId: string, chapterId: number, updates: Partial<Chapter>) => {
    await delay();
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

  /**
   * POST /views/:viewId/chapters
   * Creates a new chapter for a specific view.
   */
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