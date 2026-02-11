import { db, delay } from "./mock-db";
import type { Annotation } from "~/data/mock-session-data";

export const annotationService = {
  /**
   * POST /sessions/:sessionId/annotations
   * Creates a new annotation attached to the session (or primary view).
   */
  create: async (sessionId: number, annotation: Annotation) => {
    await delay();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session || !session.views[0]) throw new Error("Session or View not found");

    session.views[0].annotations.unshift(annotation);
    db.commit();
    return annotation;
  },

  /**
   * PATCH /sessions/:sessionId/annotations/:annotationId
   * Updates an existing annotation.
   */
  update: async (sessionId: number, annotationId: number, updates: Partial<Annotation>) => {
    await delay(100);
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const annotation = session.views
      .flatMap((v) => v.annotations)
      .find((a) => a.id === annotationId);

    if (!annotation) throw new Error("Annotation not found");

    Object.assign(annotation, updates);
    db.commit();
    return annotation;
  },
};