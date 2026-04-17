import { useEffect, useMemo, useState } from "react";
import {
  getVideoPlaybackCacheState,
  subscribeToVideoPlaybackCache,
  touchVideoPlaybackCache,
  warmVideoPlayback,
} from "~/lib/video-playback-cache";

function canWarmVideoCache(sourceUrl: string | undefined): boolean {
  if (!sourceUrl || sourceUrl.startsWith("blob:")) {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(sourceUrl, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function usePlayableVideoSource(
  videoId: string | undefined,
  sourceUrl: string | undefined,
) {
  const [version, setVersion] = useState(0);
  const isBlobSource = Boolean(sourceUrl?.startsWith("blob:"));
  const shouldWarmCache = canWarmVideoCache(sourceUrl);

  useEffect(() => {
    if (!videoId || !shouldWarmCache) return;

    return subscribeToVideoPlaybackCache(videoId, () => {
      setVersion((value) => value + 1);
    });
  }, [shouldWarmCache, videoId]);

  useEffect(() => {
    if (!videoId || !sourceUrl || !shouldWarmCache) return;

    touchVideoPlaybackCache(videoId);
    void warmVideoPlayback(videoId, sourceUrl).catch(() => {
      // Remote playback remains available even if local blob caching fails.
    });
  }, [shouldWarmCache, sourceUrl, videoId]);

  const cacheState = useMemo(() => {
    if (!videoId || !shouldWarmCache) {
      return { objectUrl: null, status: "idle" as const };
    }

    return getVideoPlaybackCacheState(videoId);
  }, [shouldWarmCache, videoId, version]);

  return {
    playbackUrl: cacheState.objectUrl ?? sourceUrl ?? "",
    isUsingCachedPlayback: Boolean(cacheState.objectUrl && !isBlobSource),
    isCachingPlayback: shouldWarmCache && cacheState.status === "loading",
  };
}