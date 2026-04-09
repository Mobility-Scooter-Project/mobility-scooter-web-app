import { create } from "zustand";
import { type Session, type View } from "~/data/mock-session-data";
import { sessionService } from "~/services/sessions";
import { videoService } from "~/services/videos";

type SessionStore = {
  sessions: Session[];
  activeSessionId: string;
  activeViewId: string;

  actions: {
    setActiveSessionId: (id: string) => void;
    setActiveViewId: (id: string) => void;
    fetchSessions: () => Promise<void>;
    fetchSessionVideos: (sessionId: string) => Promise<void>;
    addSession: (data: {
      patientId: string;
      date: Date;
      mediaTitle: string;
      file: File;
    }) => Promise<void>;
    addView: (
      sessionId: string,
      viewData: { label: string; file: File },
    ) => string | null;
    updateViewLabel: (sessionId: string, viewId: string, label: string) => void;
    markAsRead: (sessionId: string) => void;
  };
};

/**
 * Converts an API session date (YYYY-MM-DD) to the display format (MM/DD/YYYY).
 */
function formatSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

/**
 * Manages the list of sessions, active session selection, and view creation.
 * Session metadata is fetched from and persisted to the backend API.
 */
export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: "",
  activeViewId: "",

  actions: {
    setActiveSessionId: (id) =>
      set((state) => {
        const nextSession = state.sessions.find((session) => session.id === id);

        return {
          activeSessionId: id,
          activeViewId: nextSession?.views[0]?.id ?? "",
        };
      }),

    setActiveViewId: (id) => set({ activeViewId: id }),

    /**
     * Fetches all sessions from the API and replaces the local list.
     * Preserves any locally-added views on sessions that already exist.
     */
    fetchSessions: async () => {
      let data;
      try {
        data = await sessionService.getAll();
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return;
      }

      const existing = get().sessions;

      const sessions: Session[] = data.map((item) => {
        const prev = existing.find((s) => s.id === item.sessionId);
        return {
          id: item.sessionId,
          patientUuid: item.patientUuid,
          date: formatSessionDate(item.sessionDate),
          notification: prev?.notification ?? false,
          views: prev?.views ?? [],
        };
      });

      const first = sessions[0];
      set((state) => ({
        sessions,
        activeSessionId: state.activeSessionId || first?.id || "",
        activeViewId: state.activeViewId || first?.views[0]?.id || "",
      }));
    },

    /**
     * Fetches videos for a session from the API and populates its views.
     * Skips sessions that already have views (e.g. locally-created ones).
     * For each video, fetches a presigned playback URL.
     */
    fetchSessionVideos: async (sessionId: string) => {
      const session = get().sessions.find((s) => s.id === sessionId);
      if (!session || session.views.length > 0) return;

      let videoItems;
      try {
        videoItems = await sessionService.getSessionVideos(sessionId);
      } catch (error) {
        console.error("Failed to fetch session videos:", error);
        return;
      }

      if (videoItems.length === 0) return;

      // Fetch presigned URLs for all videos in parallel.
      const views: View[] = await Promise.all(
        videoItems.map(async (item) => {
          let videoUrl = "";
          try {
            videoUrl = await videoService.getPresignedUrl(item.videoId);
          } catch (error) {
            console.error(`Failed to get URL for video ${item.videoId}:`, error);
          }

          return {
            id: item.videoId,
            videoId: item.videoId,
            label: item.name,
            videoUrl,
            points: [],
            chapters: [],
            annotations: [],
            risks: [],
          };
        }),
      );

      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          // Don't overwrite if views appeared while we were fetching.
          if (s.views.length > 0) return s;
          return { ...s, views };
        }),
        // Auto-select the first view if this is the active session.
        ...(state.activeSessionId === sessionId && !state.activeViewId
          ? { activeViewId: views[0]?.id ?? "" }
          : {}),
      }));
    },

    /**
     * Creates a session via the API, uploads the video file, and
     * attaches a local view using the blob URL for immediate playback.
     */
    addSession: async (data) => {
      const sessionDate = [
        data.date.getFullYear(),
        String(data.date.getMonth() + 1).padStart(2, "0"),
        String(data.date.getDate()).padStart(2, "0"),
      ].join("-");

      const sessionTime = [
        String(data.date.getHours()).padStart(2, "0"),
        String(data.date.getMinutes()).padStart(2, "0"),
      ].join(":");

      const result = await sessionService.create({
        patientId: data.patientId,
        sessionDate,
        sessionTime,
      });

      // Upload the video: create metadata then upload the file.
      const videoMeta = await videoService.createMetadata(
        result.sessionId,
        result.patientUuid,
        data.file.name,
      );
      await videoService.uploadFile(videoMeta.id, data.file);

      const newSession: Session = {
        id: result.sessionId,
        patientUuid: result.patientUuid,
        date: formatSessionDate(sessionDate),
        notification: false,
        views: [
          {
            id: videoMeta.id,
            videoId: videoMeta.id,
            label: data.mediaTitle,
            videoUrl: URL.createObjectURL(data.file),
            points: [],
            chapters: [],
            annotations: [],
            risks: [],
          },
        ],
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: result.sessionId,
        activeViewId: videoMeta.id,
      }));
    },

    /**
     * Adds a new view to an existing session by uploading the video
     * and attaching it locally.
     */
    addView: (sessionId, viewData) => {
      const newViewId = `v${Date.now()}`;
      const session = get().sessions.find((s) => s.id === sessionId);

      // Fire-and-forget: upload video in the background.
      if (session?.patientUuid) {
        videoService
          .createMetadata(sessionId, session.patientUuid, viewData.file.name)
          .then((meta) => {
            videoService.uploadFile(meta.id, viewData.file);

            // Patch the videoId onto the view once metadata is created.
            set((state) => ({
              sessions: state.sessions.map((s) => {
                if (s.id !== sessionId) return s;
                return {
                  ...s,
                  views: s.views.map((v) =>
                    v.id === newViewId ? { ...v, videoId: meta.id } : v,
                  ),
                };
              }),
            }));
          })
          .catch((err) => console.error("Failed to upload view video:", err));
      }

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
