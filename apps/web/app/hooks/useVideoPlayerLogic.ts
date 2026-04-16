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
  const {
    setIsPlaying,
    setCurrentTime,
    seekTo,
    setDuration,
    setVolume,
    toggleMute,
  } = useVideoStore((state) => state.actions);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) video.play().catch(() => setIsPlaying(false));
    if (!isPlaying && !video.paused) video.pause();

    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }

    video.volume = volume;
    video.muted = isMuted;
  }, [isPlaying, currentTime, volume, isMuted, videoRef, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      setDuration(video.duration);
    }
  }, [setDuration, videoRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!videoRef.current) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          setIsPlaying(!useVideoStore.getState().isPlaying);
          break;
        case "arrowleft":
          event.preventDefault();
          seekTo(Math.max(0, videoRef.current.currentTime - 5));
          break;
        case "arrowright":
          event.preventDefault();
          seekTo(Math.min(videoRef.current.duration, videoRef.current.currentTime + 5));
          break;
        case "j":
          event.preventDefault();
          seekTo(Math.max(0, videoRef.current.currentTime - 15));
          break;
        case "l":
          event.preventDefault();
          seekTo(Math.min(videoRef.current.duration, videoRef.current.currentTime + 15));
          break;
        case "m":
          event.preventDefault();
          toggleMute();
          break;
        case "arrowup":
          event.preventDefault();
          setVolume(Math.min(1, useVideoStore.getState().volume + 0.1));
          break;
        case "arrowdown":
          event.preventDefault();
          setVolume(Math.max(0, useVideoStore.getState().volume - 0.1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seekTo, setIsPlaying, setVolume, toggleMute, videoRef]);

  return {
    handleTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) =>
      setCurrentTime(event.currentTarget.currentTime),
    handleLoadedMetadata: (event: React.SyntheticEvent<HTMLVideoElement>) =>
      setDuration(event.currentTarget.duration),
    handleEnded: () => setIsPlaying(false),
    togglePlay: () => setIsPlaying(!isPlaying),
  };
}