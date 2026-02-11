import { create } from "zustand";
import { type Session, MOCK_SESSIONS, type View } from "~/data/mock-session-data";

type SessionStore = {
  sessions: Session[];
  activeSessionId: string;

  actions: {
    setActiveSessionId: (id: string) => void;
    addSession: (data: { patientId: string; date: Date; mediaTitle: string; file: File }) => void;
    addView: (sessionId: number, viewData: { label: string; file: File }) => void;
    markAsRead: (sessionId: number) => void;
  };
};

/**
 * Manages the list of sessions, active session selection, and view creation.
 */
export const useSessionStore = create<SessionStore>((set) => ({
  sessions: MOCK_SESSIONS,
  activeSessionId: MOCK_SESSIONS[MOCK_SESSIONS.length - 1]?.id.toString() ?? "1",

  actions: {
    setActiveSessionId: (id) => set({ activeSessionId: id }),
    
    addSession: (data) => set((state) => {
      const nextId = Math.max(...state.sessions.map(s => s.id), 0) + 1;
      
      const newSession: Session = {
        id: nextId,
        patientId: data.patientId,
        date: data.date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
        notification: false,
        views: [
          {
            id: `v${Date.now()}`,
            label: data.mediaTitle,
            videoUrl: URL.createObjectURL(data.file),
            points: [],
            chapters: [],
            annotations: [],
          }
        ]
      };

      return { 
        sessions: [...state.sessions, newSession],
        activeSessionId: nextId.toString()
      };
    }),

    addView: (sessionId, viewData) => set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        
        const newView: View = {
          id: `v${Date.now()}`,
          label: viewData.label,
          videoUrl: URL.createObjectURL(viewData.file),
          points: [],
          chapters: [],
          annotations: [],
        };
        return { ...s, views: [...s.views, newView] };
      })
    })),

    markAsRead: (sessionId) => set((state) => ({
      sessions: state.sessions.map((s) => 
        s.id === sessionId ? { ...s, notification: false } : s
      )
    })),
  },
}));