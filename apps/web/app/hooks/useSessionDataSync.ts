import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

/**
 * Manages the synchronization between the Active Session/View
 * and the specific data stores (Chapters, Annotations, Points).
 *
 * @returns The currently active view ID and a setter for it.
 */
export function useSessionDataSync() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  
  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const setAnnotations = useAnnotationStore((state) => state.actions.setAnnotations);
  const setPoints = usePointStore((state) => state.actions.setPoints);

  const [activeViewId, setActiveViewId] = useState<string>("");

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
    [sessions, activeSessionId]
  );

  // Auto-select the first view when the session changes
  useEffect(() => {
    if (activeSession && activeSession.views.length > 0) {
      const viewExists = activeSession.views.some((v) => v.id === activeViewId);
      if (!viewExists || !activeViewId) {
        setActiveViewId(activeSession.views[0].id);
      }
    } else {
      setActiveViewId("");
    }
  }, [activeSession, activeViewId]);

  // Hydrate stores whenever the Active View changes
  useEffect(() => {
    if (!activeSession || !activeViewId) {
        // Optional: Clear stores if no view is selected
        return; 
    }

    const view = activeSession.views.find((v) => v.id === activeViewId);
    if (view) {
      // Load data into global stores
      loadChapters(activeSession.id, activeViewId);
      setAnnotations(view.annotations);
      setPoints(view.points);
    }
  }, [activeViewId, activeSession, loadChapters, setAnnotations, setPoints]);

  return {
    activeSession,
    activeViewId,
    setActiveViewId,
  };
}