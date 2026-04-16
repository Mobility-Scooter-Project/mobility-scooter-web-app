import { useEffect, useMemo } from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";
import { KEYPOINT_TO_NAME } from "~/components/session/player/video/overlays/overlay-utils";
import type { Point } from "~/data/mock-session-data";

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

  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const loadChaptersFromApi = useChapterStore(
    (state) => state.actions.loadChaptersFromApi,
  );
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
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId],
  );

  useEffect(() => {
    if (activeSessionId) {
      void fetchSessionVideos(activeSessionId);
    }
  }, [activeSessionId, fetchSessionVideos]);

  useEffect(() => {
    if (!activeSession) {
      if (activeViewId) setActiveViewId("");
      return;
    }

    const viewExists = activeSession.views.some((view) => view.id === activeViewId);
    const nextViewId = viewExists
      ? activeViewId
      : (activeSession.views[0]?.id ?? "");

    if (nextViewId !== activeViewId) {
      setActiveViewId(nextViewId);
    }
  }, [activeSession, activeViewId, setActiveViewId]);

  useEffect(() => {
    if (!activeSession || !activeViewId) return;

    const view = activeSession.views.find((item) => item.id === activeViewId);
    if (!view) return;

    if (view.videoId && view.points.length === 0) {
      const defaultPoints: Point[] = Object.values(KEYPOINT_TO_NAME).map((name) => ({
        id: name,
        name,
        status: "visible" as const,
      }));
      setPoints(defaultPoints);
    } else {
      setPoints(view.points);
    }

    if (view.videoId) {
      void ensureViewVideoUrl(view.videoId);
      void loadAnnotations(view.videoId);
      void loadChaptersFromApi(activeViewId, view.videoId);
    } else {
      setAnnotations(view.annotations);
      loadChapters(activeViewId, view.chapters);
    }
  }, [
    activeSession,
    activeViewId,
    ensureViewVideoUrl,
    loadAnnotations,
    loadChapters,
    loadChaptersFromApi,
    setAnnotations,
    setPoints,
  ]);

  return {
    activeSession,
    activeViewId,
    setActiveViewId,
  };
}
