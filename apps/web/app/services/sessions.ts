import { db, delay } from "./mock-db";

export const sessionService = {
  /**
   * GET /sessions
   * Returns a lightweight list for sidebars/lists.
   */
  getAll: async () => {
    await delay();
    return db.sessions.map(({ id, date, notification }) => ({
      id,
      date,
      notification,
    }));
  },

  /**
   * GET /sessions/:id
   * Returns full session details including views.
   */
  getById: async (id: number) => {
    await delay();
    const session = db.sessions.find((s) => s.id === id);
    if (!session) throw new Error(`Session ${id} not found`);
    return session;
  },
};