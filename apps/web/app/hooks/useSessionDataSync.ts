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
 *
 * When the active session changes, fetches its videos from the API.
 * When the active view changes (and has a videoId), fetches annotations
 * and task-detection chapters from the API.
 */
export function useSessionDataSync() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const activeViewId = useSessionStore((state) => state.activeViewId);
  const { setActiveViewId, fetchSessions, fetchSessionVideos } =
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

  // Fetch sessions from the API once on mount.
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId],
  );

  // When the active session changes, fetch its videos if needed.
  useEffect(() => {
    if (activeSessionId) {
      fetchSessionVideos(activeSessionId);
    }
  }, [activeSessionId, fetchSessionVideos]);

  // Keep activeViewId in sync with available views.
  useEffect(() => {
    if (!activeSession) {
      if (activeViewId) setActiveViewId("");
      return;
    }

    const viewExists = activeSession.views.some((v) => v.id === activeViewId);
    const nextViewId = viewExists
      ? activeViewId
      : (activeSession.views[0]?.id ?? "");

    if (nextViewId !== activeViewId) {
      setActiveViewId(nextViewId);
    }
  }, [activeSession, activeViewId, setActiveViewId]);

  // Sync analysis data when the active view changes.
  useEffect(() => {
    if (!activeSession || !activeViewId) return;

    const view = activeSession.views.find((v) => v.id === activeViewId);
    if (!view) return;

    // If the view has a backend videoId and no local points, generate them
    // from the known keypoint mapping so the points panel is populated.
    if (view.videoId && view.points.length === 0) {
      const defaultPoints: Point[] = Object.values(KEYPOINT_TO_NAME).map(
        (name) => ({ id: name, name, status: "visible" as const }),
      );
      setPoints(defaultPoints);
    } else {
      setPoints(view.points);
    }

    // If the view has a backend videoId, load data from the API.
    if (view.videoId) {
      loadAnnotations(view.videoId);
      loadChaptersFromApi(activeViewId, view.videoId);
    } else {
      // Fallback: use local data from the view object.
      setAnnotations(view.annotations);
      loadChapters(activeViewId, view.chapters);
    }
  }, [
    activeSession,
    activeViewId,
    loadChapters,
    loadChaptersFromApi,
    loadAnnotations,
    setAnnotations,
    setPoints,
  ]);

  return {
    activeSession,
    activeViewId,
    setActiveViewId,
  };
}
