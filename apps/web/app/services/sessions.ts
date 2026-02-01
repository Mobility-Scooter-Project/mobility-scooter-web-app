// services/sessions.ts
import { db, delay } from "./mock-db";

export const sessionService = {
  // GET /sessions (Lightweight list for the sidebar)
  getAll: async () => {
    await delay();
    return db.data.map(({ id, date, notification }) => ({ 
      id, 
      date, 
      notification 
    }));
  },

  // GET /sessions/:id (Full details)
  getById: async (id: number) => {
    await delay();
    const session = db.data.find((s) => s.id === id);
    if (!session) throw new Error(`Session ${id} not found`);
    return session;
  }
};