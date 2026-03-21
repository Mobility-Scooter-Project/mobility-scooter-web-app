import { useEffect, useMemo } from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

/**
 * Syncs the active session/view with the derived stores.
 */
export function useSessionDataSync() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const activeViewId = useSessionStore((state) => state.activeViewId);
  const setActiveViewId = useSessionStore((state) => state.actions.setActiveViewId);

  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const setAnnotations = useAnnotationStore((state) => state.actions.setAnnotations);
  const setPoints = usePointStore((state) => state.actions.setPoints);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
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

    loadChapters(activeSession.id, activeViewId);
    setAnnotations(view.annotations);
    setPoints(view.points);
  }, [activeSession, activeViewId, loadChapters, setAnnotations, setPoints]);

  return {
    activeSession,
    activeViewId,
    setActiveViewId,
  };
}