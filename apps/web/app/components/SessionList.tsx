import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Icon } from "~/components/ui/icon";

// proof of concept, not final
export function SessionList({ sessions: sessions }: { sessions: { id: string; date: string }[] }) {
  const activeSessionId = "some-active-id";

  return (
    <ScrollArea className="h-full scroll-fade">
      <div className="flex flex-col gap-3 p-2">
        <Button variant="list">
          <Icon name="Plus" size="secondary" className="mr-2" />
          New Session
        </Button>
        
        {sessions.map((session) => (
          <Button
            key={session.id}
            variant="list"
            className=""
            data-state={session.id === activeSessionId ? "on" : "off"}
          >
            <Icon name="FileText" size="secondary" className="mr-2" />
            {session.date}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}