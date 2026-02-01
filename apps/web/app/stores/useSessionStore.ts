import { create } from "zustand";
import { type Session, MOCK_SESSIONS } from "~/data/mock-session-data";

type SessionStore = {
  sessions: Session[];
  activeSessionId: string;

  actions: {
    setActiveSessionId: (id: string) => void;
  };
};

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: MOCK_SESSIONS,
  activeSessionId: MOCK_SESSIONS[MOCK_SESSIONS.length - 1]?.id.toString() ?? "1",

  actions: {
    setActiveSessionId: (id) => set({ activeSessionId: id }),
  },
}));
