import { db, delay } from "./mock-db";
import type { Point } from "~/data/mock-session-data";

export const pointService = {
  /**
   * PATCH /sessions/:sessionId/points/:pointId
   * Updates a single point's status or details.
   */
  update: async (sessionId: number, pointId: number, updates: Partial<Point>) => {
    await delay(50);
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const point = session.views
      .flatMap((v) => v.points)
      .find((p) => p.id === pointId);

    if (!point) throw new Error("Point not found");

    Object.assign(point, updates);
    db.commit();
    return point;
  },

  /**
   * PATCH /sessions/:sessionId/points/batch
   * Bulk updates points (e.g., toggling visibility for all).
   */
  updateAll: async (sessionId: number, updates: Partial<Point>[]) => {
    await delay(100);
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    updates.forEach((update) => {
      session.views.forEach((view) => {
        const point = view.points.find((p) => p.id === update.id);
        if (point) Object.assign(point, update);
      });
    });
    db.commit();
  },
};