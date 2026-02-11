import { ScrollArea } from "~/components/ScrollArea";
import { VideoContainer } from "~/components/session/video/VideoContainer";
import { useState } from "react";
import { Toggle } from "~/components/Toggle";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AddViewDialog } from "./AddViewDialog";
import { useSessionStore } from "~/stores/useSessionStore";
import { useSessionDataSync } from "~/hooks/useSessionDataSync";
import { VIEW_TOGGLES, type ViewToggleKey } from "~/config/session-constants";

/**
 * Middle container responsible for video playback and view controls.
 * - Displays the video player for the active view and provides toggles for overlaying data (e.g. Annotations, Points).
 * - Contains a tab list for switching between multiple views within the same session.
 */
export function ViewPanel() {
  const { activeSession, activeViewId, setActiveViewId } = useSessionDataSync();
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  
  // Initialize toggles from config
  const [pressedToggles, setPressedToggles] = useState<Record<string, boolean>>(() =>
    VIEW_TOGGLES.reduce((acc, t) => ({ ...acc, [t.key]: t.default }), {})
  );

  const currentView = activeSession?.views.find((v) => v.id === activeViewId);
  const viewTitle = currentView ? currentView.label : "No View Selected";
  const videoSrc = currentView ? currentView.videoUrl : undefined;

  const handleToggleChange = (key: ViewToggleKey) => {
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
        {VIEW_TOGGLES.map((toggle) => (
          <Toggle
            key={toggle.key}
            pressed={pressedToggles[toggle.key]}
            onPressedChange={() => handleToggleChange(toggle.key)}
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

      <AddViewDialog 
        open={isAddViewOpen} 
        onOpenChange={setIsAddViewOpen}
        sessionId={Number(activeSessionId)}
      />
    </div>
  );
}