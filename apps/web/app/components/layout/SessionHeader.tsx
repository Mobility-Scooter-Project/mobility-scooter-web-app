import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { useSessionStore } from "~/stores/useSessionStore";

const HEADER_ITEM_CLASS = "px-4 whitespace-nowrap";

export function SessionHeader() {
  const activeSession = useSessionStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId) ??
    null,
  );

  // edit here when age and gender are added in api
  const metadata = [
    activeSession?.patientId
      ? { label: "ID", value: activeSession.patientId }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <header className="flex items-center gap-4.5">
      <section className="bg-card flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full py-2 pl-4.5 pr-2 text-base">
        <div className="flex min-w-0 items-center gap-3 ">
          <span className={`${HEADER_ITEM_CLASS} font-semibold`}>Session</span>

          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {metadata.map((item) => (
              <span
                key={item.label}
                className={`${HEADER_ITEM_CLASS} min-w-0 truncate`}
                title={`${item.label} ${item.value}`}
              >
                {item.label} {item.value}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeSession?.date ? (
            <span className={HEADER_ITEM_CLASS}>{activeSession.date}</span>
          ) : null}
          <Button
            variant="ghost"
            size="inline"
            disabled
            aria-label="Patient details unavailable"
            className="disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="ChevronRight" className="size-5" />
          </Button>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="bg-card h-11 w-80 rounded-full"
      />
    </header>
  );
}
