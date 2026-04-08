import { useEffect, useMemo } from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

/**
 * Fetches sessions from the API on mount and syncs the active
 * session/view with the derived chapter, annotation, and point stores.
 */
export function useSessionDataSync() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const activeViewId = useSessionStore((state) => state.activeViewId);
  const { setActiveViewId, fetchSessions } = useSessionStore(
    (state) => state.actions,
  );

  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const setAnnotations = useAnnotationStore((state) => state.actions.setAnnotations);
  const setPoints = usePointStore((state) => state.actions.setPoints);

  // Fetch sessions from the API once on mount.
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId],
  );

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

  useEffect(() => {
    if (!activeSession || !activeViewId) return;

    const view = activeSession.views.find((v) => v.id === activeViewId);
    if (!view) return;

    loadChapters(activeViewId, view.chapters);
    setAnnotations(view.annotations);
    setPoints(view.points);
  }, [activeSession, activeViewId, loadChapters, setAnnotations, setPoints]);

  return {
    activeSession,
    activeViewId,
    setActiveViewId,
  };
}
