import { Icon } from "~/components/Icon";
import { ScrollArea } from "../ScrollArea";
import { cn } from "~/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { Button } from "~/components/Button";
import { TextInput } from "../TextInput";

import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

/**
 * Left-side panel component for displaying sessions for this user
 * Ordered by most recent. Sessions w/ notifications appear at the top.
 */
export function SessionsPanel() {
  // Global session state
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const setSessionId = useSessionStore(
    (state) => state.actions.setActiveSessionId
  );

  // Actions for other stores
  const setChapters = useChapterStore((state) => state.actions.setChapters);
  const setAnnotations = useAnnotationStore(
    (state) => state.actions.setAnnotations
  );
  const setPoints = usePointStore((state) => state.actions.setPoints);

  const handleSessionSelect = (idStr: string) => {
    const id = Number(idStr);
    setSessionId(idStr);

    // Find the session data
    const session = sessions.find((s) => s.id === id);
    if (session && session.views.length > 0) {
      // Default to the first view when switching sessions
      const firstView = session.views[0];
      setChapters(firstView.chapters);
      setAnnotations(firstView.annotations);
      setPoints(firstView.points);
    } else {
        // Clear if no views exist
        setChapters([]);
        setAnnotations([]);
        setPoints([]);
    }
  };

  const reversedSessions = [...sessions].sort((a, b) => b.id - a.id);

  return (
    <main className="flex flex-col h-full">
      <TextInput id="text" type="text" placeholder="Search here...">
        <Icon name="Search" />
      </TextInput>

      <Tabs
        value={activeSessionId}
        onValueChange={handleSessionSelect}
        className="flex flex-col flex-1"
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col">
            {/* new session button */}
            <Button variant="ghost" className="text-foreground mt-6 mb-4">
              <Icon name="SquarePen" />
              <span>New Session</span>
            </Button>

            {/* sessions list */}
            <TabsList className="flex flex-col h-auto justify-start gap-0.5 rounded-none p-0 w-full items-start">
              {reversedSessions.map((session) => (
                <TabsTrigger
                  key={session.id}
                  value={session.id.toString()} // id as string
                  className={cn(
                    "text-base text-foreground justify-start w-full px-4 mb-2 h-10 rounded-md transition-none",
                    "data-[state=active]:bg-foreground/10 data-[state=active]:shadow-none data-[state=active]:text-foreground",
                    "hover:bg-foreground/10",
                    "bg-transparent border-0",
                    session.notification && "font-semibold"
                  )}
                >
                  <div className="flex items-center">
                    <Icon name="FilePlay" />
                    <span className="ml-2">{session.date}</span>
                  </div>
                  {session.notification && (
                    // notification circle
                    <div className="h-2 w-2 rounded-full bg-foreground ml-auto" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </ScrollArea>
      </Tabs>
    </main>
  );
}