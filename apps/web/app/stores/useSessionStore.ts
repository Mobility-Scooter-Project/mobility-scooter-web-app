import { create } from "zustand";
import { type Session, type View } from "~/data/mock-session-data";
import { sessionService } from "~/services/sessions";
import { videoService } from "~/services/videos";
import {
  formatSessionDate,
  normalizeSessionTime,
} from "~/lib/session-date-time";

const VIEW_TITLE_SAVE_DELAY_MS = 1_200;

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

function replaceSession(sessions: Session[], nextSession: Session): Session[] {
  return [nextSession, ...sessions.filter((session) => session.id !== nextSession.id)];
}

function isRemoteVideoUrl(url: string): boolean {
  return Boolean(url) && !url.startsWith("blob:");
}

function resolveViewLabel(title: string, fileName: string): string {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : fileName;
}

type MediaInput = {
  title: string;
  file: File;
};

type CreatedMedia = MediaInput & {
  videoId: string;
};

type UploadProgressCallback = (progress: {
  completed: number;
  received: number;
  total: number;
}) => void;

async function createMediaBatch(
  sessionId: string,
  patientUuid: string,
  media: MediaInput[],
  failureMessage: string,
): Promise<CreatedMedia[]> {
  const createdMedia: CreatedMedia[] = [];

  for (const entry of media) {
    try {
      const meta = await videoService.createMetadata(
        sessionId,
        patientUuid,
        entry.file,
        entry.title,
      );

      createdMedia.push({
        title: entry.title,
        file: entry.file,
        videoId: meta.id,
      });
    } catch (error) {
      console.error("Failed to create video metadata:", error);
    }
  }

  if (createdMedia.length === 0) {
    throw new Error(failureMessage);
  }

  return createdMedia;
}

function buildUploadedViews(media: CreatedMedia[]): View[] {
  return media.map((entry) => ({
    id: entry.videoId,
    videoId: entry.videoId,
    label: entry.title,
    videoUrl: URL.createObjectURL(entry.file),
    remoteVideoUrl: "",
    points: [],
    chapters: [],
    annotations: [],
    risks: [],
    uploading: false,
    uploadError: false,
  }));
}

async function uploadMediaBatch(
  media: CreatedMedia[],
  onProgress?: UploadProgressCallback,
): Promise<CreatedMedia[]> {
  const total = media.length;
  let completed = 0;
  let received = 0;

  onProgress?.({ completed, received, total });

  const results = await Promise.all(
    media.map(async (entry) => {
      let transferCounted = false;

      const markTransferComplete = () => {
        if (transferCounted) {
          return;
        }

        transferCounted = true;
        received += 1;
        onProgress?.({ completed, received, total });
      };

      try {
        await videoService.uploadFile(entry.videoId, entry.file, {
          onTransferComplete: markTransferComplete,
        });
        return entry;
      } catch (error) {
        console.error("Failed to upload media file:", error);
        return null;
      } finally {
        completed += 1;
        onProgress?.({ completed, received, total });
      }
    }),
  );

  return results.filter((entry): entry is CreatedMedia => entry !== null);
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
      time: string;
      media: MediaInput[];
      onUploadProgress?: UploadProgressCallback;
    }) => Promise<string>;
    addView: (
      sessionId: string,
      media: MediaInput[],
      onUploadProgress?: UploadProgressCallback,
    ) => Promise<string>;
    updateViewLabel: (sessionId: string, viewId: string, label: string) => void;
    /** Clears the uploading/error flags on a view when processing finishes. */
    markViewProcessed: (videoId: string, failed?: boolean) => void;
    /** Re-fetches the presigned video URL for a view. */
    refreshViewVideoUrl: (videoId: string) => Promise<void>;
    markAsRead: (sessionId: string) => void;
  };
};

export function selectActiveView(state: SessionStore): View | null {
  const activeSession = state.sessions.find(
    (session) => session.id === state.activeSessionId,
  );
  return activeSession?.views.find((view) => view.id === state.activeViewId) ?? null;
}

/**
 * Manages the list of sessions, active session selection, and view creation.
 * Session metadata is fetched from and persisted to the backend API.
 */
export const useSessionStore = create<SessionStore>((set, get) => {
  return {
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
            patientId: item.patientId,
            patientUuid: item.patientUuid,
            date: formatSessionDate(item.sessionDate),
            time: normalizeSessionTime(item.sessionTime),
            notification: prev?.notification ?? false,
            views: prev?.views ?? [],
          };
        });

        set((state) => ({
          sessions,
          activeSessionId: state.activeSessionId || sessions[0]?.id || "",
          activeViewId: state.activeViewId || sessions[0]?.views[0]?.id || "",
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
          remoteVideoUrl: "",
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
        if (!force && currentView.uploading) {
          return;
        }
        const hasBlobPlayback = currentView.videoUrl.startsWith("blob:");
        if (
          !force &&
          (isRemoteVideoUrl(currentView.videoUrl) ||
            (hasBlobPlayback && Boolean(currentView.remoteVideoUrl)))
        ) {
          return;
        }

        try {
          const url = await getInFlightVideoUrl(videoId);
          set((state) => ({
            sessions: updateViewByVideoId(state.sessions, videoId, (view) => ({
              ...view,
              remoteVideoUrl: url,
              videoUrl:
                !force && view.videoUrl.startsWith("blob:")
                  ? view.videoUrl
                  : url,
            })),
          }));
        } catch (error) {
          console.error(`Failed to fetch video URL for ${videoId}:`, error);
        }
      },

      /**
       * Creates a session via the API, uploads the video file, and
       * only adds it to local state once at least one upload finishes.
       */
      addSession: async (data) => {
        const sessionDate = [
          data.date.getFullYear(),
          String(data.date.getMonth() + 1).padStart(2, "0"),
          String(data.date.getDate()).padStart(2, "0"),
        ].join("-");

        const sessionTime = normalizeSessionTime(data.time);

        const result = await sessionService.create({
          patientId: data.patientId,
          sessionDate,
          sessionTime,
        });

        const createdMedia = await createMediaBatch(
          result.sessionId,
          result.patientUuid,
          data.media,
          "Failed to create media metadata for the session.",
        );
        const uploadedMedia = await uploadMediaBatch(createdMedia, data.onUploadProgress);
        const failedCount = data.media.length - uploadedMedia.length;

        if (uploadedMedia.length > 0) {
          const views = buildUploadedViews(uploadedMedia);

          const newSession: Session = {
            id: result.sessionId,
            patientId: data.patientId,
            patientUuid: result.patientUuid,
            date: formatSessionDate(sessionDate),
            time: sessionTime,
            notification: false,
            views,
          };

          set((state) => ({
            sessions: replaceSession(state.sessions, newSession),
            activeSessionId: result.sessionId,
            activeViewId: views[0]?.id ?? "",
          }));
        }

        if (failedCount > 0) {
          if (uploadedMedia.length > 0) {
            throw new Error("Some videos could not be added. Uploaded videos were kept.");
          }

          throw new Error("Failed to add the session video.");
        }

        return result.sessionId;
      },

      /**
       * Adds a new view to an existing session by uploading the video
       * and only appends successfully uploaded views.
       */
      addView: async (sessionId, media, onUploadProgress) => {
        const session = get().sessions.find((item) => item.id === sessionId);

        if (!session?.patientUuid || media.length === 0) {
          throw new Error("Session is missing required upload context.");
        }

        const createdMedia = await createMediaBatch(
          sessionId,
          session.patientUuid,
          media,
          "Failed to create media metadata for the new views.",
        );
        const uploadedMedia = await uploadMediaBatch(createdMedia, onUploadProgress);
        const failedCount = media.length - uploadedMedia.length;

        if (uploadedMedia.length > 0) {
          const views = buildUploadedViews(uploadedMedia);

          set((state) => ({
            sessions: state.sessions.map((item) => {
              if (item.id !== sessionId) return item;

              return {
                ...item,
                views: [...item.views, ...views],
              };
            }),
          }));
        }

        if (failedCount > 0) {
          if (uploadedMedia.length > 0) {
            throw new Error("Some views could not be added. Uploaded views were kept.");
          }

          throw new Error("Failed to add the new view.");
        }

        const createdViewId = uploadedMedia[0]?.videoId;
        if (!createdViewId) {
          throw new Error("Failed to upload the new view.");
        }

        return createdViewId;
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
  };
});
