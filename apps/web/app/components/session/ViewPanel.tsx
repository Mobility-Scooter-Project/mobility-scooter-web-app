import { ScrollArea } from "~/components/ScrollArea";
import { VideoContainer } from "~/components/session/video/VideoContainer";
import { useState, useEffect, useMemo } from "react";
import { Toggle } from "~/components/Toggle";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

import { useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePointStore } from "~/stores/usePointsStore";

const viewToggles = [
  { key: "gait", label: "Gait" },
  { key: "posture", label: "Posture" },
  { key: "sway", label: "Sway Displacement" },
  { key: "motion", label: "Range Of Motion" },
  { key: "points", label: "Points" },
  { key: "smartphone", label: "Smartphone" },
  { key: "gyroscope", label: "Gyroscope" },
  { key: "annotations", label: "Annotations" },
];

type ToggleKeys = (typeof viewToggles)[number]["key"];

export function ViewPanel() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const setChapters = useChapterStore((state) => state.actions.setChapters);
  const setAnnotations = useAnnotationStore(
    (state) => state.actions.setAnnotations,
  );
  const setPoints = usePointStore((state) => state.actions.setPoints);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id.toString() === activeSessionId.toString()),
    [sessions, activeSessionId],
  );

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
      setActiveViewId(activeSession.views[0].id);
    } else {
      setActiveViewId("");
    }
  }, [activeSession]);

  const handleViewChange = (viewId: string) => {
    setActiveViewId(viewId);

    if (!activeSession) return;
    const view = activeSession.views.find((v) => v.id === viewId);

    if (view) {
      setChapters(view.chapters);
      setAnnotations(view.annotations);
      setPoints(view.points);
    }
  };

  const handleToggleChange = (key: ToggleKeys) => {
    setPressedToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const currentView = activeSession?.views.find((v) => v.id === activeViewId);
  const viewTitle = currentView ? currentView.label : "No View Selected";
  const videoSrc = currentView ? currentView.videoUrl : undefined;

  return (
    <div className="flex flex-col gap-3 h-full p-2">
      <header className="flex w-full items-center">
        <span className="text-title-2 text-foreground font-semibold">
          {viewTitle}
        </span>
        <div className="flex items-center gap-3 ml-auto">
          {activeSession && activeSession.views.length > 0 && (
            <Tabs value={activeViewId} onValueChange={handleViewChange}>
              <TabsList className="flex-wrap h-auto">
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
          >
            <Icon name="Plus" />
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap gap-3">
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
        <VideoContainer src={videoSrc} />
      </ScrollArea>
    </div>
  );
}
