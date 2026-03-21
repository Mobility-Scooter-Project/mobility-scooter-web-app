import { create } from "zustand";
import { type Session, MOCK_SESSIONS, type View } from "~/data/mock-session-data";

type SessionStore = {
  sessions: Session[];
  activeSessionId: string;
  activeViewId: string;

  actions: {
    setActiveSessionId: (id: string) => void;
    setActiveViewId: (id: string) => void;
    addSession: (data: {
      patientId: string;
      date: Date;
      mediaTitle: string;
      file: File;
    }) => void;
    addView: (
      sessionId: number,
      viewData: { label: string; file: File },
    ) => string | null;
    updateViewLabel: (sessionId: number, viewId: string, label: string) => void;
    markAsRead: (sessionId: number) => void;
  };
};

/**
 * Manages the list of sessions, active session selection, and view creation.
 */
export const useSessionStore = create<SessionStore>((set) => ({
  sessions: MOCK_SESSIONS,
  activeSessionId: MOCK_SESSIONS[MOCK_SESSIONS.length - 1]?.id.toString() ?? "1",
  activeViewId:
    MOCK_SESSIONS[MOCK_SESSIONS.length - 1]?.views[0]?.id ?? "",

  actions: {
    setActiveSessionId: (id) =>
      set((state) => {
        const nextSession = state.sessions.find(
          (session) => session.id.toString() === id.toString(),
        );

        return {
          activeSessionId: id,
          activeViewId: nextSession?.views[0]?.id ?? "",
        };
      }),

    setActiveViewId: (id) => set({ activeViewId: id }),

    addSession: (data) =>
      set((state) => {
        const nextId = Math.max(...state.sessions.map((s) => s.id), 0) + 1;
        const newViewId = `v${Date.now()}`;

        const newSession: Session = {
          id: nextId,
          patientId: data.patientId,
          date: data.date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }),
          notification: false,
          views: [
            {
              id: newViewId,
              label: data.mediaTitle,
              videoUrl: URL.createObjectURL(data.file),
              points: [],
              chapters: [],
              annotations: [],
              risks: [],
            },
          ],
        };

        return {
          sessions: [...state.sessions, newSession],
          activeSessionId: nextId.toString(),
          activeViewId: newViewId,
        };
      }),

    addView: (sessionId, viewData) => {
      const newViewId = `v${Date.now()}`;

      set((state) => ({
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId) return session;

          const newView: View = {
            id: newViewId,
            label: viewData.label,
            videoUrl: URL.createObjectURL(viewData.file),
            points: [],
            chapters: [],
            annotations: [],
            risks: [],
          };

          return {
            ...session,
            views: [...session.views, newView],
          };
        }),
      }));

      return newViewId;
    },

    updateViewLabel: (sessionId, viewId, label) =>
      set((state) => ({
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId) return session;

          return {
            ...session,
            views: session.views.map((view) =>
              view.id === viewId ? { ...view, label } : view,
            ),
          };
        }),
      })),

    markAsRead: (sessionId) =>
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? { ...session, notification: false }
            : session,
        ),
      })),
  },
}));