import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { AnalysisPanel } from "~/components/session/AnalysisPanel";
import { SessionsPanel } from "~/components/session/SessionsPanel";
import { useState } from "react";

/**
 * Main session page layout with resizable panels for sessions, main content, and analysis.
 * 
 * TODO: Needs the following object data:
 *  - Session data (id, age, gender, date) -> Views -> Media/Videos
 *  - Analysis data
 *  - Chapters data
 *  - Points data
 */
export default function SessionPage() {
  const [activeSessionId, setActiveSessionId] = useState<string>("1"); // NOTE: id is a string, might be subject to change

  const handleSessionSelect = (id: string) => { // might instead re-call a data fetch
    setActiveSessionId(id);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex shrink-0 items-start justify-between gap-4">
        <section className="bg-card flex h-12 flex-1 items-center rounded-full p-4 text-subhead text-foreground justify-between">
          <div className="flex gap-12 items-center pl-6">
            <span className="font-semibold">Session</span>
            <span>ID 123456</span> {/* TODO: patient ID */}
            <span>Age 00</span> {/* TODO: dynamic age */}
            <span>Female</span> {/* TODO: dynamic gender */}
          </div>

          <div className="flex gap-6 items-center">
            <span>09/24/2025</span>
            <Button variant="inline" className="w-auto px-2.5 justify-start"> {/* NOTE: button hover style looks off imo, change later */}
              <Icon name="ChevronRight" className="size-5" />
            </Button>
          </div>
        </section>

        <div className="bg-card text-card-foreground h-12 w-64 rounded-full border p-4">
          {/* Empty container for search */}
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={15}>
          <Card className="h-full">
            <SessionsPanel activeSessionId={activeSessionId} onSessionSelect={handleSessionSelect} />
          </Card>
        </ResizablePanel>

        <ResizableHandle className="w-4 bg-background" />

        <ResizablePanel defaultSize={55} minSize={30}>
          <Card className="h-full">{/* todo */}</Card>
        </ResizablePanel>

        <ResizableHandle className="w-4 bg-background" />

        <ResizablePanel defaultSize={30} minSize={20}>
          <Card className="h-full">
            <AnalysisPanel />
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
