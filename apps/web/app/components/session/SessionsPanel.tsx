import { SearchInput } from "../SearchInput";
import { Icon } from "~/components/ui/icon";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "~/lib/utils";
// Import Tabs components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/Button";

type MockSession = {
  id: number;
  date: string;
  notification: boolean;
};

const mockSessions: MockSession[] = [
  {
    id: 1,
    date: "09/15/2025",
    notification: true,
  },
  {
    id: 2,
    date: "09/10/2025",
    notification: true,
  },
  {
    id: 3,
    date: "09/24/2025", // Changed one date to match the active session in the image
    notification: false,
  },
  {
    id: 4,
    date: "08/05/2025",
    notification: false,
  },
  {
    id: 5,
    date: "08/05/2025",
    notification: false,
  },
];

interface SessionsPanelProps {
  activeSessionId: string;
  onSessionSelect: (id: string) => void;
}

/**
 * Left-side panel component for displaying sessions for this user
 * Ordered by most recent. Sessions w/ notifications appear at the top.
 */
export function SessionsPanel({
  activeSessionId,
  onSessionSelect,
}: SessionsPanelProps) {
  return (
    <main className="flex flex-col h-full">
      <SearchInput />

      <Tabs
        value={activeSessionId}
        onValueChange={onSessionSelect}
        className="flex flex-col flex-1"
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col">
            {/* new session button */}
            <Button
              variant="ghost"
              className="text-base text-foreground w-auto px-4 mt-6 mb-4 justify-start"
            >
              <Icon name="SquarePen" />
              <span className="ml-2">New Session</span>
            </Button>

            {/* sessions list */}
            <TabsList className="flex flex-col h-auto justify-start gap-0.5 rounded-none p-0 w-full items-start">
              {mockSessions.map((session) => (
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

        {mockSessions.map((session) => (
          <TabsContent
            key={`content-${session.id}`}
            value={session.id.toString()}
            className="hidden"
          >
            {/* video content */}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
