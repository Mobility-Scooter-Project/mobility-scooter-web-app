// services/points.ts
import { db, delay } from "./mock-db";
import type { Point } from "~/data/mock-session-data";

export const pointService = {
  update: async (sessionId: number, pointId: number, updates: Partial<Point>) => {
    await delay(50); // Very fast response for UI toggles
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const point = session.points.find(p => p.id === pointId);
    if (!point) throw new Error("Point not found");

    Object.assign(point, updates);
    db.commit();
    return point;
  },

  // "Bulk" update for the 'Toggle All' feature
  updateAll: async (sessionId: number, updates: Partial<Point>[]) => {
    await delay(100);
    const session = db.data.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    updates.forEach(update => {
      const point = session.points.find(p => p.id === update.id);
      if (point) Object.assign(point, update);
    });
    db.commit();
  }
};