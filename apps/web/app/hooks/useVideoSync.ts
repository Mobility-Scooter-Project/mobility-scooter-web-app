import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { useSessionStore } from "~/stores/useSessionStore";
import { useVideoStore } from "~/stores/useVideoStore";

const VIDEO_SOURCE_RETRY_MS = 5_000;

export function useVideoSync(
  videoRef: RefObject<HTMLVideoElement | null>,
  videoId: string | undefined,
  activeViewId: string | undefined,
  playbackUrl: string | undefined,
) {
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const volume = useVideoStore((state) => state.volume);
  const isMuted = useVideoStore((state) => state.isMuted);
  const playbackRate = useVideoStore((state) => state.playbackRate);
  const currentTime = useVideoStore((state) => state.currentTime);
  const {
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsVideoLoading,
  } = useVideoStore((state) => state.actions);
  const refreshViewVideoUrl = useSessionStore(
    (state) => state.actions.refreshViewVideoUrl,
  );

  const sourceReloadingRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRetryingSource, setIsRetryingSource] = useState(false);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleSourceRetry = () => {
    if (
      retryTimerRef.current ||
      !videoId ||
      !playbackUrl ||
      playbackUrl.startsWith("blob:")
    ) {
      return;
    }

    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void refreshViewVideoUrl(videoId);
    }, VIDEO_SOURCE_RETRY_MS);
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, videoRef]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, videoRef]);

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
      setIsRetryingSource(false);
      setIsVideoLoading(false);
      clearRetryTimer();
      return;
    }

    if (!playbackUrl) {
      sourceReloadingRef.current = false;
      setIsRetryingSource(false);
      setIsVideoLoading(false);
      clearRetryTimer();
      return;
    }

    clearRetryTimer();
    sourceReloadingRef.current = true;
    setIsVideoLoading(true);
    video.load();
  }, [playbackUrl, setIsVideoLoading, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    setCurrentTime(0);
    setDuration(0);
    clearRetryTimer();

    if (!video) return;

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, [activeViewId, setCurrentTime, setDuration, videoRef]);

  const resumePlaybackIfNeeded = (video: HTMLVideoElement) => {
    clearRetryTimer();
    sourceReloadingRef.current = false;
    setIsRetryingSource(false);
    video.playbackRate = playbackRate;

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
    isRetryingSource,
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
      clearRetryTimer();
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
      setIsRetryingSource(true);
      setIsVideoLoading(false);
      scheduleSourceRetry();
    },
  };
}
