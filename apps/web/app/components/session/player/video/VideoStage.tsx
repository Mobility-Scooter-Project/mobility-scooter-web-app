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

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isPlaying = useVideoStore((s) => s.isPlaying);
  const volume = useVideoStore((s) => s.volume);
  const isMuted = useVideoStore((s) => s.isMuted);
  const currentTime = useVideoStore((s) => s.currentTime);
  const { setCurrentTime, setDuration, setIsPlaying } = useVideoStore(
    (s) => s.actions,
  );

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

    video.muted = isMuted;
    video.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      void video.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    video.pause();
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const maxTime = Number.isFinite(video.duration) ? video.duration : currentTime;
    const nextTime = Math.max(0, Math.min(currentTime, maxTime));

    if (Math.abs(video.currentTime - nextTime) > 0.05) {
      video.currentTime = nextTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime || 0);

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [currentView?.id, setCurrentTime, setDuration]);

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
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-3xl bg-black/5">
            <span className="text-label text-foreground">No video selected</span>
          </div>
        )}
      </VideoSurface>
    </section>
  );
}