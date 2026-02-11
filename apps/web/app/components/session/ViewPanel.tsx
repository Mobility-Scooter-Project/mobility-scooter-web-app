import { ScrollArea } from "~/components/ScrollArea";
import { VideoContainer } from "~/components/session/video/VideoContainer";
import { useState, useEffect, useMemo } from "react";
import { Toggle } from "~/components/Toggle";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AddViewDialog } from "./AddViewDialog";

import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

const viewToggles = [{ key: "annotations", label: "Annotations" }];

type ToggleKeys = (typeof viewToggles)[number]["key"];

export function ViewPanel() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const loadChapters = useChapterStore((state) => state.actions.loadChapters);
  const setAnnotations = useAnnotationStore(
    (state) => state.actions.setAnnotations,
  );
  const setPoints = usePointStore((state) => state.actions.setPoints);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
    [sessions, activeSessionId],
  );

  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string>("");
  const [pressedToggles, setPressedToggles] = useState<Record<string, boolean>>(
    {
      gait: false,
      posture: true,
      sway: false,
      motion: false,
      points: false,
      smartphone: false,
      gyroscope: false,
      annotations: true,
    },
  );

  useEffect(() => {
    if (activeSession && activeSession.views.length > 0) {
      // If the currently selected view ID doesn't exist in the new session's views, 
      // default to the first one.
      const viewExists = activeSession.views.some(v => v.id === activeViewId);
      if (!viewExists || activeViewId === "") {
         setActiveViewId(activeSession.views[0].id);
      }
    } else {
      setActiveViewId("");
    }
  }, [activeSession, activeViewId]);

  useEffect(() => {
    if (!activeSession || !activeViewId) return;
    const view = activeSession.views.find((v) => v.id === activeViewId);
    if (view) {
      loadChapters(activeSession.id, activeViewId);
      setAnnotations(view.annotations);
      setPoints(view.points);
    }
  }, [activeViewId, activeSession, loadChapters, setAnnotations, setPoints]);

  const currentView = activeSession?.views.find((v) => v.id === activeViewId);
  const viewTitle = currentView ? currentView.label : "No View Selected";
  const videoSrc = currentView ? currentView.videoUrl : undefined;

  const handleToggleChange = (key: ToggleKeys) => {
    setPressedToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-3 h-full py-2">
      <header className="flex w-full items-center px-2">
        <span className="text-title-2 text-foreground font-semibold">
          {viewTitle}
        </span>
        <div className="flex items-center gap-3 ml-auto">
          {activeSession && activeSession.views.length > 0 && (
            <Tabs value={activeViewId} onValueChange={setActiveViewId}>
              <TabsList className="flex-wrap h-auto gap-1">
                {activeSession.views.map((view) => (
                  <TabsTrigger key={view.id} value={view.id}>
                    {view.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Add new view"
            className="shrink-0"
            onClick={() => setIsAddViewOpen(true)}
          >
            <Icon name="Plus" />
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap gap-3 px-2">
        {viewToggles.map((toggle) => (
          <Toggle
            key={toggle.key}
            pressed={pressedToggles[toggle.key as ToggleKeys]}
            onPressedChange={() => handleToggleChange(toggle.key as ToggleKeys)}
            className="text-foreground"
          >
            {toggle.label}
          </Toggle>
        ))}
      </section>

      <ScrollArea className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full min-h-full px-2">
          <VideoContainer src={videoSrc} />
        </div>
      </ScrollArea>

      {/* Add View Dialog */}
      <AddViewDialog 
        open={isAddViewOpen} 
        onOpenChange={setIsAddViewOpen}
        sessionId={Number(activeSessionId)}
      />
    </div>
  );
}