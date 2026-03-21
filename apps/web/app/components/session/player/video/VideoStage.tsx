import { useEffect, useRef, useState } from "react";

import { useSessionDataSync } from "~/hooks/useSessionDataSync";
import { VideoStageToggles } from "./VideoStageToggles";
import { VideoSurface } from "./VideoSurface";
import { useVideoStore } from "~/stores/useVideoStore";

export type StageOverlayKey = "gait" | "sway" | "points";

const DEFAULT_OVERLAYS: Record<StageOverlayKey, boolean> = {
  gait: true,
  sway: false,
  points: false,
};

export function VideoStage() {
  const { activeSession, activeViewId } = useSessionDataSync();
  const setDuration = useVideoStore((s) => s.actions.setDuration);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentView = activeSession?.views.find((view) => view.id === activeViewId);

  const [enabledOverlays, setEnabledOverlays] =
    useState<Record<StageOverlayKey, boolean>>(DEFAULT_OVERLAYS);

  const handleToggle = (key: StageOverlayKey) => {
    setEnabledOverlays((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [currentView?.id, setDuration]);

  return (
    <section className="flex flex-col gap-y-3">
      <VideoStageToggles
        enabledOverlays={enabledOverlays}
        onToggle={handleToggle}
      />

      <VideoSurface enabledOverlays={enabledOverlays}>
        {currentView?.videoUrl ? (
          <video
            key={currentView.id}
            ref={videoRef}
            src={currentView.videoUrl}
            preload="metadata"
            className="block aspect-video w-full object-cover"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            controls
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