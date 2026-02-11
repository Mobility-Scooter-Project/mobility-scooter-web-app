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
import { useState, useRef, useMemo } from "react";
import { type ImperativePanelGroupHandle } from "react-resizable-panels";
import { useSessionStore } from "~/stores/useSessionStore";

export default function SessionPage() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const setActiveSessionId = useSessionStore((state) => state.actions.setActiveSessionId);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
    [sessions, activeSessionId]
  );

  const DEFAULT_SIZES = [15, 50, 30];
  const panelRef = useRef<ImperativePanelGroupHandle>(null);
  
  const resetLayout = () => panelRef.current?.setLayout(DEFAULT_SIZES);
  const handleSessionSelect = (id: string) => setActiveSessionId(id);

  const patientId = activeSession?.patientId || "Unknown ID";
  const sessionDate = activeSession?.date || new Date().toLocaleDateString();

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex shrink-0 items-start justify-between gap-4">
        <section className="bg-card flex h-12 flex-1 items-center rounded-full p-4 text-subhead text-foreground justify-between">
          <div className="flex gap-12 items-center pl-6">
            <span className="font-semibold">Session</span>
            <div className="flex gap-2">
              <span className="text-muted-foreground">ID</span>
              <span>{patientId}</span>
            </div>
            <span className="text-muted-foreground hidden">Age --</span>
            <span className="text-muted-foreground hidden">Gender --</span>
          </div>

          <div className="flex gap-6 items-center">
            <span>{sessionDate}</span>
            <Button variant="ghost" className="size-8">
              <Icon name="ChevronRight" className="size-5" />
            </Button>
          </div>
        </section>

        <div className="bg-card text-card-foreground h-12 w-64 rounded-full border p-4">
          {/* search stuff here */}
        </div>
      </header>

      <ResizablePanelGroup
        ref={panelRef}
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={DEFAULT_SIZES[0]} minSize={15}>
          <Card className="h-full">
            <SessionsPanel />
          </Card>
        </ResizablePanel>

        <ResizableHandle
          className="w-4 bg-background"
          onDoubleClick={resetLayout}
        />

        <ResizablePanel defaultSize={DEFAULT_SIZES[1]} minSize={40}>
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