import { useState, useMemo } from "react";
import type { Session } from "~/data/mock-session-data";

/**
 * Most recently used sorting hook for sessions
 * Currently tailored for the mock data structure (json)
 *
 * @param sessions - List of sessions to sort
 * @param initialId - Optional initial session ID to prioritize
 *
 * @returns sortedSessions - Sessions sorted by MRU logic
 * @returns trackClick - Function to call when a session is clicked to update MRU order
 */
export function useSessionMRUSort(sessions: Session[], activeId: string) {
  const [mruStack, setMruStack] = useState<string[]>([]);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  const sortedSessions = useMemo(() => {
    const historyMap = new Map(mruStack.map((id, index) => [id, index]));

    const sortInactive = (a: Session, b: Session) => {
      // Notifications at top
      if (a.notification !== b.notification) {
        return a.notification ? -1 : 1;
      }

      // MRU Stack
      const aId = a.id;
      const bId = b.id;
      const aIdx = historyMap.has(aId) ? historyMap.get(aId)! : Infinity;
      const bIdx = historyMap.has(bId) ? historyMap.get(bId)! : Infinity;
      
      if (aIdx !== bIdx) return aIdx - bIdx;

      // Fallback (sort by ID desc)
      return b.id < a.id ? -1 : b.id > a.id ? 1 : 0;
    };

    // Regular sort (on load)
    if (pinnedIndex === null || !activeId) {
      return [...sessions].sort(sortInactive);
    }

    const activeSession = sessions.find((s) => s.id === activeId);
    const restSessions = sessions.filter((s) => s.id !== activeId);

    restSessions.sort(sortInactive);

    if (activeSession) {
      const safeIndex = Math.min(Math.max(0, pinnedIndex), restSessions.length);
      restSessions.splice(safeIndex, 0, activeSession);
    }

    return restSessions;
  }, [sessions, mruStack, activeId, pinnedIndex]);

  // Lock selected session in place + update MRU stack
  const trackClick = (id: string, clickedIndex: number) => {
    setPinnedIndex(clickedIndex);
    
    setMruStack((prev) => {
      const filtered = prev.filter((prevId) => prevId !== id && prevId !== activeId);
      
      if (activeId && activeId !== id) {
        return [activeId, ...filtered];
      }
      return filtered;
    });
  };

  return { sortedSessions, trackClick };
}