import { useEffect, useRef, type RefObject, type SyntheticEvent } from "react";
import { useVideoStore } from "~/stores/useVideoStore";

export function useVideoSync(
  videoRef: RefObject<HTMLVideoElement | null>,
  activeViewId: string | undefined,
  playbackUrl: string | undefined,
) {
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const volume = useVideoStore((state) => state.volume);
  const isMuted = useVideoStore((state) => state.isMuted);
  const currentTime = useVideoStore((state) => state.currentTime);
  const {
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsVideoLoading,
  } = useVideoStore((state) => state.actions);

  const sourceReloadingRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, videoRef]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      void videoRef.current.play().catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, setIsPlaying, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const maxTime = Number.isFinite(video.duration) ? video.duration : currentTime;
    const nextTime = Math.max(0, Math.min(currentTime, maxTime));

    if (Math.abs(video.currentTime - nextTime) > 0.05) {
      video.currentTime = nextTime;
    }
  }, [currentTime, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      sourceReloadingRef.current = false;
      setIsVideoLoading(false);
      return;
    }

    if (!playbackUrl) {
      sourceReloadingRef.current = false;
      setIsVideoLoading(false);
      return;
    }

    sourceReloadingRef.current = true;
    setIsVideoLoading(true);
    video.load();
  }, [playbackUrl, setIsVideoLoading, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    setCurrentTime(0);
    setDuration(0);

    if (!video) return;

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [activeViewId, setCurrentTime, setDuration, videoRef]);

  const resumePlaybackIfNeeded = (video: HTMLVideoElement) => {
    sourceReloadingRef.current = false;
    if (isPlaying && video.paused) {
      void video.play().catch(() => {
        // The normal play effect already handles play-state failures.
      });
    }
  };

  const handleDurationChange = (event: SyntheticEvent<HTMLVideoElement>) => {
    const nextDuration = event.currentTarget.duration;
    if (Number.isFinite(nextDuration)) {
      setDuration(nextDuration);
    }
  };

  return {
    onLoadStart: () => setIsVideoLoading(true),
    onLoadedMetadata: handleDurationChange,
    onLoadedData: (event: SyntheticEvent<HTMLVideoElement>) => {
      setIsVideoLoading(false);
      resumePlaybackIfNeeded(event.currentTarget);
    },
    onCanPlay: (event: SyntheticEvent<HTMLVideoElement>) => {
      setIsVideoLoading(false);
      resumePlaybackIfNeeded(event.currentTarget);
    },
    onCanPlayThrough: (event: SyntheticEvent<HTMLVideoElement>) => {
      setIsVideoLoading(false);
      resumePlaybackIfNeeded(event.currentTarget);
    },
    onDurationChange: handleDurationChange,
    onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) =>
      setCurrentTime(event.currentTarget.currentTime),
    onPlay: () => setIsPlaying(true),
    onPlaying: () => {
      sourceReloadingRef.current = false;
      setIsPlaying(true);
      setIsVideoLoading(false);
    },
    onPause: () => {
      if (sourceReloadingRef.current) {
        return;
      }
      setIsPlaying(false);
    },
    onWaiting: () => setIsVideoLoading(true),
    onStalled: () => setIsVideoLoading(true),
    onSeeking: () => setIsVideoLoading(true),
    onSeeked: () => setIsVideoLoading(false),
    onError: () => {
      sourceReloadingRef.current = false;
      setIsVideoLoading(false);
    },
  };
}