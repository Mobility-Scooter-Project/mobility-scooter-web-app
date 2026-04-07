import { SessionCard } from "~/components/session/directory/SessionCard";
import type { Session } from "~/data/mock-session-data";
import { useSessionMRUSort } from "~/hooks/useMRUSort";

interface SessionListProps {
  /* List of sessions to display */
  sessions: Session[];
  /* Currently active session ID for highlighting */
  activeSessionId: string;
  /* Callback when a session is selected, with notification status */
  onSelect: (id: string, hadNotification: boolean) => void;
}

/**
 * Displays a list of sessions with their date, active state, and notification status.
 *
 * @param sessions - List of sessions to display
 * @param activeSessionId - Currently active session ID for highlighting
 * @param onSelect - Callback when a session is selected, with notification status
 *
 * @returns
 */
export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
}: SessionListProps) {
  const { sortedSessions, trackClick } = useSessionMRUSort(
    sessions,
    activeSessionId,
  );

  const handleSelection = (session: Session, index: number) => {
    const idStr = session.id.toString();
    trackClick(idStr, index);
    onSelect(idStr, session.notification);
  };

  return (
    <div className="flex flex-col gap-3">
      {sortedSessions.map((session, index) => (
        <SessionCard
          key={session.id}
          date={session.date}
          isActive={activeSessionId === session.id.toString()}
          hasNotification={session.notification}
          onClick={() => handleSelection(session, index)}
        />
      ))}
    </div>
  );
}