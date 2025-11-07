import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/Resizable";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AnalysisPanel } from "~/components/session/AnalysisPanel";
import { SessionsPanel } from "~/components/session/SessionsPanel";
import { ViewPanel } from "~/components/session/ViewPanel";
import { useState, useRef } from "react";
import { type ImperativePanelGroupHandle } from "react-resizable-panels";

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
  const DEFAULT_SIZES = [15, 55, 30];

  const panelRef = useRef<ImperativePanelGroupHandle>(null);
  const resetLayout = () => panelRef.current?.setLayout(DEFAULT_SIZES);
  const handleSessionSelect = (id: string) => setActiveSessionId(id);

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex shrink-0 items-start justify-between gap-4">
        <section className="bg-card flex h-12 flex-1 items-center rounded-full p-4 text-subhead text-foreground justify-between">
          <div className="flex gap-12 items-center pl-6">
            <span className="font-semibold">Session</span>
            <span>ID 123456</span> {/* TODO: patient ID */}
            <span>Age 00</span> {/* TODO: dynamic age ^ */}
            <span>Female</span> {/* TODO: dynamic gender ^ */}
          </div>

          <div className="flex gap-6 items-center">
            <span>09/24/2025</span> {/* TODO: date from session */}
            <Button variant="ghost" className="size-8">
              {/* NOTE: button hover style looks off imo, change later */}
              <Icon name="ChevronRight" className="size-5" />
            </Button>
          </div>
        </section>

        <div className="bg-card text-card-foreground h-12 w-64 rounded-full border p-4">
          {/* Empty container for search */}
        </div>
      </header>

      <ResizablePanelGroup
        ref={panelRef}
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={DEFAULT_SIZES[0]} minSize={15}>
          <Card className="h-full">
            <SessionsPanel
              activeSessionId={activeSessionId}
              onSessionSelect={handleSessionSelect}
            />
          </Card>
        </ResizablePanel>

        <ResizableHandle
          className="w-4 bg-background"
          onDoubleClick={resetLayout}
        />

        <ResizablePanel defaultSize={DEFAULT_SIZES[1]} minSize={30}>
          <Card className="h-full">
            <ViewPanel />
          </Card>
        </ResizablePanel>

        <ResizableHandle
          className="w-4 bg-background"
          onDoubleClick={resetLayout}
        />

        <ResizablePanel defaultSize={DEFAULT_SIZES[2]} minSize={20}>
          <Card className="h-full">
            <AnalysisPanel />
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
