import { useEffect, useMemo } from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";
import { KEYPOINT_TO_NAME } from "~/components/session/player/video/overlays/overlay-utils";
import type { Point } from "~/data/mock-session-data";

const DEFAULT_POINTS: Point[] = Object.values(KEYPOINT_TO_NAME).map((name) => ({
  id: name,
  name,
  status: "visible",
}));

/**
 * Fetches sessions from the API on mount and syncs the active
 * session/view with the derived chapter, annotation, and point stores.
 */
export function useSessionDataSync() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const activeViewId = useSessionStore((state) => state.activeViewId);
  const { setActiveViewId, fetchSessions, fetchSessionVideos, ensureViewVideoUrl } =
    useSessionStore((state) => state.actions);

  const chapterVideoId = useChapterStore((state) => state.videoId);
  const chapterViewId = useChapterStore((state) => state.activeViewId);
  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const loadChaptersFromApi = useChapterStore(
    (state) => state.actions.loadChaptersFromApi,
  );

  const annotationVideoId = useAnnotationStore((state) => state.videoId);
  const loadAnnotations = useAnnotationStore(
    (state) => state.actions.loadAnnotations,
  );
  const setAnnotations = useAnnotationStore(
    (state) => state.actions.setAnnotations,
  );

  const setPoints = usePointStore((state) => state.actions.setPoints);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const activeView = useMemo(
    () => activeSession?.views.find((view) => view.id === activeViewId) ?? null,
    [activeSession, activeViewId],
  );

  useEffect(() => {
    if (!activeSessionId) return;
    void fetchSessionVideos(activeSessionId);
  }, [activeSessionId, fetchSessionVideos]);

  useEffect(() => {
    if (!activeSession) {
      if (activeViewId) {
        setActiveViewId("");
      }
      return;
    }

    const viewExists = activeSession.views.some((view) => view.id === activeViewId);
    const nextViewId = viewExists ? activeViewId : (activeSession.views[0]?.id ?? "");

    if (nextViewId !== activeViewId) {
      setActiveViewId(nextViewId);
    }
  }, [activeSession, activeViewId, setActiveViewId]);

  const activeVideoId = activeView?.videoId ?? null;
  const activePoints = activeView?.points ?? null;
  const activeAnnotations = activeView?.annotations ?? null;
  const activeChapters = activeView?.chapters ?? null;

  useEffect(() => {
    if (!activeView || !activeViewId) return;

    if (activeVideoId) {
      setPoints(activePoints && activePoints.length > 0 ? activePoints : DEFAULT_POINTS);
      void ensureViewVideoUrl(activeVideoId);

      if (annotationVideoId !== activeVideoId) {
        void loadAnnotations(activeVideoId);
      }

      if (chapterVideoId !== activeVideoId || chapterViewId !== activeViewId) {
        void loadChaptersFromApi(activeViewId, activeVideoId);
      }

      return;
    }

    setPoints(activePoints ?? []);
    setAnnotations(activeAnnotations ?? []);
    loadChapters(activeViewId, activeChapters ?? []);
  }, [
    activeAnnotations,
    activeChapters,
    activePoints,
    activeVideoId,
    activeViewId,
    annotationVideoId,
    chapterVideoId,
    chapterViewId,
    ensureViewVideoUrl,
    loadAnnotations,
    loadChapters,
    loadChaptersFromApi,
    setAnnotations,
    setPoints,
  ]);

  return {
    activeSession,
    activeView,
    activeViewId,
    setActiveViewId,
  };
}