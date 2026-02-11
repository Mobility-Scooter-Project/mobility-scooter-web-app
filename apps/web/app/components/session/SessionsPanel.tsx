import { useState, useMemo } from "react";
import { Icon } from "~/components/Icon";
import { ScrollArea } from "../ScrollArea";
import { cn } from "~/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { Button } from "~/components/Button";
import { TextInput } from "../TextInput";
import { NewSessionDialog } from "./NewSessionDialog";
import { useSessionStore } from "~/stores/useSessionStore";

/**
 * Left-most container, displays a searchable, scrollable list of available sessions.
 * - Allows selection of the active session, which drives the content in the other panels.
 * - Displays notifications for sessions with new activity.
 * - Contains a button to create a new session.
 */
export function SessionsPanel() {
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const { setActiveSessionId, markAsRead } = useSessionStore((state) => state.actions);

  const handleSessionSelect = (idStr: string) => {
    const id = Number(idStr);
    
    // Clear notification logic
    const session = sessions.find((s) => s.id === id);
    if (session?.notification) {
      markAsRead(id);
    }

    setActiveSessionId(idStr);
  };

  // Sort: Notifications first, then by ID descending
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.notification !== b.notification) {
        return a.notification ? -1 : 1;
      }
      return b.id - a.id;
    });
  }, [sessions]);

  return (
    <main className="flex flex-col h-full">
      <TextInput id="text" type="text" placeholder="Search here...">
        <Icon name="Search" />
      </TextInput>

      <Tabs
        value={activeSessionId}
        onValueChange={handleSessionSelect}
        className="flex flex-col flex-1 mt-4"
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col pr-4">
            <Button 
              variant="ghost" 
              className="text-foreground mb-4 justify-start px-4 hover:bg-transparent"
              onClick={() => setIsNewSessionOpen(true)}
            >
              <Icon name="SquarePen" />
              <span>New Session</span>
            </Button>

            <TabsList className="flex flex-col h-auto justify-start gap-1 rounded-none p-0 w-full items-start">
              {sortedSessions.map((session) => (
                <TabsTrigger
                  key={session.id}
                  value={session.id.toString()}
                  className={cn(
                    "text-base text-foreground justify-start w-full px-4 mb-1 h-10 rounded-md transition-none",
                    "data-[state=active]:bg-foreground/10 data-[state=active]:shadow-none data-[state=active]:text-foreground",
                    "hover:bg-foreground/5",
                    "bg-transparent border-0",
                    session.notification && "font-semibold"
                  )}
                >
                  <div className="flex items-center w-full">
                    <Icon name="FilePlay" className="shrink-0" />
                    <span className="ml-3 truncate">{session.date}</span>
                    {session.notification && (
                      <div className="h-2 w-2 rounded-full bg-foreground ml-auto shrink-0" />
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </ScrollArea>
      </Tabs>

      <NewSessionDialog 
        open={isNewSessionOpen} 
        onOpenChange={setIsNewSessionOpen} 
      />
    </main>
  );
}