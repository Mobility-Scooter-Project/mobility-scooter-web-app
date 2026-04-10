import { useMemo } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { useSessionStore } from "~/stores/useSessionStore";

export function SessionHeader() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
    [sessions, activeSessionId],
  );

  const patientId = activeSession?.patientUuid || "Unknown ID";
  const sessionDate = activeSession?.date || new Date().toLocaleDateString();

  return (
    <header className="flex shrink-0 items-start justify-between gap-4">
      <section className="bg-card flex h-12 flex-1 items-center justify-between rounded-full p-4 text-subhead text-foreground">
        <div className="flex gap-12 items-center pl-6">
          <span className="font-semibold">Session</span>
          <div className="flex gap-2">
            <span>Patient ID {patientId}</span>
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <span>{sessionDate}</span>
          <Button variant="ghost" className="size-8">
            <Icon name="ChevronRight" className="size-5" />
          </Button>
        </div>
      </section>
    </header>
  );
}
