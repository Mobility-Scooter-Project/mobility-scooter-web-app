// services/annotations.ts
import { db, delay } from "./mock-db";
import type { Annotation } from "~/data/mock-session-data";

export const annotationService = {
  create: async (sessionId: number, annotation: Annotation) => {
    await delay();
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    session.annotations.unshift(annotation);
    db.commit();
    return annotation;
  },

  update: async (sessionId: number, annotationId: number, updates: Partial<Annotation>) => {
    await delay(100);
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const annotation = session.annotations.find(a => a.id === annotationId);
    if (!annotation) throw new Error("Annotation not found");

    Object.assign(annotation, updates);
    db.commit();
    return annotation;
  }
};