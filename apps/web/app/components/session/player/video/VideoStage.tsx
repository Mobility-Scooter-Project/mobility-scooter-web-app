import { useEffect, useRef } from "react";

import type { View } from "~/data/mock-session-data";
import { useKeypointSync } from "~/hooks/useKeypointSync";
import { useKeypointStore } from "~/stores/useKeypointStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { VideoStageToggles } from "./VideoStageToggles";
import { StageOverlay } from "./StageOverlay";

interface VideoStageProps {
  activeView: View | null;
}

export function VideoStage({ activeView }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isPlaying = useVideoStore((s) => s.isPlaying);
  const volume = useVideoStore((s) => s.volume);
  const isMuted = useVideoStore((s) => s.isMuted);
  const currentTime = useVideoStore((s) => s.currentTime);
  const { setCurrentTime, setDuration, setIsPlaying } = useVideoStore(
    (s) => s.actions,
  );

  // Sync keypoints from the API and read cached frames from the store.
  useKeypointSync(activeView?.videoId);
  const frames = useKeypointStore((s) => s.frames);
  
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
      void video.play().catch(() => setIsPlaying(false));
      return;
    }
    video.pause();
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const maxTime = Number.isFinite(video.duration)
      ? video.duration
      : currentTime;
    const nextTime = Math.max(0, Math.min(currentTime, maxTime));

    if (Math.abs(video.currentTime - nextTime) > 0.05) {
      video.currentTime = nextTime;
    }
  }, [currentTime]);

  // Reset playback position and read duration when the active view changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime || 0);

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [activeView?.id, setCurrentTime, setDuration]);

  return (
    <section className="flex flex-col gap-y-3">
      <VideoStageToggles />

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
        {activeView?.videoUrl ? (
          <video
            key={activeView.id}
            ref={videoRef}
            src={activeView.videoUrl}
            preload="metadata"
            className="block h-full w-full object-contain"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-label text-white/50">No video selected</span>
          </div>
        )}

        <StageOverlay frames={frames} />
      </div>
    </section>
  );
}
