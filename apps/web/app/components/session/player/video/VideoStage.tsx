import { useMemo, useState } from "react";

import { useSessionDataSync } from "~/hooks/useSessionDataSync";

import { VideoStageToggles } from "./VideoStageToggles";
import { VideoSurface } from "./VideoSurface";

export type StageOverlayKey = "gait" | "sway" | "points";

const DEFAULT_OVERLAYS: Record<StageOverlayKey, boolean> = {
  gait: true,
  sway: false,
  points: false,
};

export function VideoStage() {
  const { activeSession, activeViewId } = useSessionDataSync();

  const currentView = useMemo(
    () => activeSession?.views.find((view) => view.id === activeViewId),
    [activeSession, activeViewId],
  );

  const [enabledOverlays, setEnabledOverlays] =
    useState<Record<StageOverlayKey, boolean>>(DEFAULT_OVERLAYS);

  const handleToggle = (key: StageOverlayKey) => {
    setEnabledOverlays((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <section className="flex flex-col gap-y-3">
      <VideoStageToggles
        enabledOverlays={enabledOverlays}
        onToggle={handleToggle}
      />

      <VideoSurface enabledOverlays={enabledOverlays}>
        {currentView?.videoUrl ? (
          <video
            src={currentView.videoUrl}
            className="block aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-3xl bg-black/5">
            <span className="text-label text-foreground">
              No video selected
            </span>
          </div>
        )}
      </VideoSurface>
    </section>
  );
}
