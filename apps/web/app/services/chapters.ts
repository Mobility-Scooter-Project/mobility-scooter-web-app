// services/chapters.ts
import { db, delay } from "./mock-db";
import type { Chapter } from "~/data/mock-session-data";

export const chapterService = {
  // POST /sessions/:id/chapters
  create: async (sessionId: number, chapter: Chapter) => {
    await delay();
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    session.chapters.unshift(chapter);
    db.commit();
    return chapter;
  },

  // PATCH /chapters/:id
  update: async (sessionId: number, chapterId: number, updates: Partial<Chapter>) => {
    // In a real app, you might not need sessionId if chapterId is unique globally
    await delay(100); // Faster response for small edits
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const chapter = session.chapters.find(c => c.id === chapterId);
    if (!chapter) throw new Error("Chapter not found");

    Object.assign(chapter, updates);
    db.commit();
    return chapter;
  }
};