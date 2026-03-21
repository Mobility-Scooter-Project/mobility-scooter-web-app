import { useEffect, type RefObject } from "react";
import { useVideoStore } from "~/stores/useVideoStore";

/**
 * Encapsulates video element logic:
 * 1. Syncs Store state -> Video Element (Play, Pause, Seek, Volume).
 * 2. Syncs Video Events -> Store state (TimeUpdate, Duration, Ended).
 * 3. Handles Keyboard Shortcuts.
 */
export function useVideoPlayerLogic(videoRef: RefObject<HTMLVideoElement | null>) {
  const { isPlaying, currentTime, volume, isMuted } = useVideoStore();
  const { setIsPlaying, setCurrentTime, setDuration, setVolume, toggleMute } = useVideoStore((state) => state.actions);

  // 1. Sync: Store -> Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) video.play().catch(() => setIsPlaying(false));
    if (!isPlaying && !video.paused) video.pause();
    
    // Threshold check prevents infinite seek loops
    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
    
    video.volume = volume;
    video.muted = isMuted;
  }, [isPlaying, currentTime, volume, isMuted, videoRef, setIsPlaying]);

  // 2. Initial Metadata Check (Fixes 0:00 duration bug)
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      setDuration(video.duration);
    }
  }, [setDuration, videoRef]);

  // 3. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          setIsPlaying(!useVideoStore.getState().isPlaying);
          break;
        case "arrowleft":
          e.preventDefault();
          setCurrentTime(Math.max(0, videoRef.current.currentTime - 5));
          break;
        case "arrowright":
          e.preventDefault();
          setCurrentTime(Math.min(videoRef.current.duration, videoRef.current.currentTime + 5));
          break;
        case "j":
          e.preventDefault();
          setCurrentTime(Math.max(0, videoRef.current.currentTime - 15));
          break;
        case "l":
          e.preventDefault();
          setCurrentTime(Math.min(videoRef.current.duration, videoRef.current.currentTime + 15));
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCurrentTime, setIsPlaying, toggleMute, videoRef]);

  return {
    handleTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => setCurrentTime(e.currentTarget.currentTime),
    handleLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration),
    handleEnded: () => setIsPlaying(false),
    togglePlay: () => setIsPlaying(!isPlaying),
  };
}