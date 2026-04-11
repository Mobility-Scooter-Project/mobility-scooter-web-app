import { useEffect, type RefObject } from "react";
import { useVideoStore } from "~/stores/useVideoStore";
import type { View } from "~/data/mock-session-data";

export function useVideoSync(videoRef: RefObject<HTMLVideoElement | null>, activeView: View | null) {
  const isPlaying = useVideoStore((s) => s.isPlaying);
  const volume = useVideoStore((s) => s.volume);
  const isMuted = useVideoStore((s) => s.isMuted);
  const currentTime = useVideoStore((s) => s.currentTime);
  const { setCurrentTime, setDuration, setIsPlaying } = useVideoStore((s) => s.actions);

  // Sync Audio
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, videoRef]);

  // Sync Playback State
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      void videoRef.current.play().catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying, videoRef]);

  // Sync Playhead Time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const maxTime = Number.isFinite(video.duration) ? video.duration : currentTime;
    const nextTime = Math.max(0, Math.min(currentTime, maxTime));

    if (Math.abs(video.currentTime - nextTime) > 0.05) {
      video.currentTime = nextTime;
    }
  }, [currentTime, videoRef]);

  // Handle URL change & View resets
  useEffect(() => {
    if (!videoRef.current || !activeView?.videoUrl) return;
    videoRef.current.load();
  }, [activeView?.videoUrl, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime || 0);
    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [activeView?.id, setCurrentTime, setDuration, videoRef]);

  // Return standard event handlers to attach directly to the DOM element
  return {
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration),
    onDurationChange: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => setCurrentTime(e.currentTarget.currentTime),
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
  };
}