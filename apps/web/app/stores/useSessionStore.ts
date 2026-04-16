import { create } from "zustand";
import { type Session, type View } from "~/data/mock-session-data";
import { sessionService } from "~/services/sessions";
import { videoService } from "~/services/videos";

const VIEW_TITLE_SAVE_DELAY_MS = 700;

const pendingViewTitleSaves = new Map<string, ReturnType<typeof setTimeout>>();
const inFlightVideoUrlLoads = new Map<string, Promise<string>>();

function clearPendingViewTitleSave(videoId: string) {
  const timer = pendingViewTitleSaves.get(videoId);
  if (timer) {
    clearTimeout(timer);
    pendingViewTitleSaves.delete(videoId);
  }
}

function scheduleViewTitleSave(videoId: string, title: string) {
  clearPendingViewTitleSave(videoId);

  const timer = setTimeout(() => {
    pendingViewTitleSaves.delete(videoId);
    void videoService.updateTitle(videoId, title).catch((error) => {
      console.error(`Failed to persist video title for ${videoId}:`, error);
    });
  }, VIEW_TITLE_SAVE_DELAY_MS);

  pendingViewTitleSaves.set(videoId, timer);
}

function getInFlightVideoUrl(videoId: string): Promise<string> {
  const existing = inFlightVideoUrlLoads.get(videoId);
  if (existing) {
    return existing;
  }

  const request = videoService.getPresignedUrl(videoId).finally(() => {
    inFlightVideoUrlLoads.delete(videoId);
  });

  inFlightVideoUrlLoads.set(videoId, request);
  return request;
}

function findViewByVideoId(sessions: Session[], videoId: string): View | null {
  for (const session of sessions) {
    const view = session.views.find((item) => item.videoId === videoId);
    if (view) return view;
  }

  return null;
}

function updateViewByVideoId(
  sessions: Session[],
  videoId: string,
  updater: (view: View) => View,
): Session[] {
  return sessions.map((session) => ({
    ...session,
    views: session.views.map((view) =>
      view.videoId === videoId ? updater(view) : view,
    ),
  }));
}

function isRemoteVideoUrl(url: string): boolean {
  return Boolean(url) && !url.startsWith("blob:");
}

/**
 * Converts an API session date (YYYY-MM-DD) to the display format (MM/DD/YYYY).
 */
function formatSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function resolveViewLabel(title: string, fileName: string): string {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : fileName;
}

type SessionStore = {
  sessions: Session[];
  activeSessionId: string;
  activeViewId: string;

  actions: {
    setActiveSessionId: (id: string) => void;
    setActiveViewId: (id: string) => void;
    fetchSessions: () => Promise<void>;
    fetchSessionVideos: (sessionId: string) => Promise<void>;
    ensureViewVideoUrl: (videoId: string, force?: boolean) => Promise<void>;
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
    /** Clears the uploading/error flags on a view when processing finishes. */
    markViewProcessed: (videoId: string, failed?: boolean) => void;
    /** Re-fetches the presigned video URL for a view. */
    refreshViewVideoUrl: (videoId: string) => Promise<void>;
    markAsRead: (sessionId: string) => void;
  };
};

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
        const prev = existing.find((session) => session.id === item.sessionId);
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
     * Fetches video metadata for a session and populates its views.
     * Playback URLs are fetched lazily for the active view only.
     */
    fetchSessionVideos: async (sessionId: string) => {
      const session = get().sessions.find((item) => item.id === sessionId);
      if (!session || session.views.length > 0) return;

      let videoItems;
      try {
        videoItems = await sessionService.getSessionVideos(sessionId);
      } catch (error) {
        console.error("Failed to fetch session videos:", error);
        return;
      }

      const views: View[] = videoItems.map((item) => ({
        id: item.videoId,
        videoId: item.videoId,
        label: resolveViewLabel(item.title, item.fileName),
        videoUrl: "",
        points: [],
        chapters: [],
        annotations: [],
        risks: [],
      }));

      set((state) => ({
        sessions: state.sessions.map((item) => {
          if (item.id !== sessionId) return item;
          if (item.views.length > 0) return item;
          return { ...item, views };
        }),
        ...(state.activeSessionId === sessionId && !state.activeViewId
          ? { activeViewId: views[0]?.id ?? "" }
          : {}),
      }));
    },

    ensureViewVideoUrl: async (videoId, force = false) => {
      const currentView = findViewByVideoId(get().sessions, videoId);
      if (!currentView) return;
      if (!force && (isRemoteVideoUrl(currentView.videoUrl) || currentView.videoUrl.startsWith("blob:"))) {
        return;
      }

      try {
        const url = await getInFlightVideoUrl(videoId);
        set((state) => ({
          sessions: updateViewByVideoId(state.sessions, videoId, (view) => ({
            ...view,
            videoUrl: url,
          })),
        }));
      } catch (error) {
        console.error(`Failed to fetch video URL for ${videoId}:`, error);
      }
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

      const videoMeta = await videoService.createMetadata(
        result.sessionId,
        result.patientUuid,
        data.file,
        data.mediaTitle,
      );

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
            uploading: true,
          },
        ],
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: result.sessionId,
        activeViewId: videoMeta.id,
      }));

      videoService
        .uploadFile(videoMeta.id, data.file)
        .then(() => {
          set((state) => ({
            sessions: updateViewByVideoId(state.sessions, videoMeta.id, (view) => ({
              ...view,
              uploading: false,
              uploadError: false,
            })),
          }));
          void get().actions.refreshViewVideoUrl(videoMeta.id);
        })
        .catch((error) => {
          console.error("Background upload failed:", error);
          set((state) => ({
            sessions: updateViewByVideoId(state.sessions, videoMeta.id, (view) => ({
              ...view,
              uploading: false,
              uploadError: true,
            })),
          }));
        });
    },

    /**
     * Adds a new view to an existing session by uploading the video
     * and attaching it locally.
     */
    addView: (sessionId, viewData) => {
      const newViewId = `v${Date.now()}`;
      const session = get().sessions.find((item) => item.id === sessionId);

      if (session?.patientUuid) {
        videoService
          .createMetadata(sessionId, session.patientUuid, viewData.file, viewData.label)
          .then((meta) => {
            set((state) => ({
              sessions: state.sessions.map((item) => {
                if (item.id !== sessionId) return item;
                return {
                  ...item,
                  views: item.views.map((view) =>
                    view.id === newViewId ? { ...view, videoId: meta.id } : view,
                  ),
                };
              }),
            }));

            return videoService.uploadFile(meta.id, viewData.file).then(() => meta.id);
          })
          .then((videoId) => {
            set((state) => ({
              sessions: updateViewByVideoId(state.sessions, videoId, (view) => ({
                ...view,
                uploading: false,
                uploadError: false,
              })),
            }));
            void get().actions.refreshViewVideoUrl(videoId);
          })
          .catch((error) => {
            console.error("Failed to upload view video:", error);
            set((state) => ({
              sessions: state.sessions.map((item) => {
                if (item.id !== sessionId) return item;
                return {
                  ...item,
                  views: item.views.map((view) =>
                    view.id === newViewId
                      ? { ...view, uploading: false, uploadError: true }
                      : view,
                  ),
                };
              }),
            }));
          });
      }

      set((state) => ({
        sessions: state.sessions.map((item) => {
          if (item.id !== sessionId) return item;

          const newView: View = {
            id: newViewId,
            label: viewData.label,
            videoUrl: URL.createObjectURL(viewData.file),
            points: [],
            chapters: [],
            annotations: [],
            risks: [],
            uploading: true,
          };

          return {
            ...item,
            views: [...item.views, newView],
          };
        }),
      }));

      return newViewId;
    },

    updateViewLabel: (sessionId, viewId, label) => {
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
      }));

      const view = get()
        .sessions.find((session) => session.id === sessionId)
        ?.views.find((item) => item.id === viewId);
      if (view?.videoId) {
        scheduleViewTitleSave(view.videoId, label);
      }
    },

    markViewProcessed: (videoId, failed) =>
      set((state) => ({
        sessions: updateViewByVideoId(state.sessions, videoId, (view) => ({
          ...view,
          uploading: false,
          uploadError: failed ?? false,
        })),
      })),

    refreshViewVideoUrl: async (videoId) => {
      await get().actions.ensureViewVideoUrl(videoId, true);
    },

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
