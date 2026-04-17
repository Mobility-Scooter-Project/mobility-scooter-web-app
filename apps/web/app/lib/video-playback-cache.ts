export type VideoPlaybackCacheStatus = "idle" | "loading" | "ready" | "error";

type VideoPlaybackCacheEntry = {
  videoId: string;
  objectUrl: string | null;
  promise: Promise<string> | null;
  sourceUrl: string | null;
  status: VideoPlaybackCacheStatus;
  lastAccessedAt: number;
  lastFailureAt: number;
};

const MAX_READY_VIDEO_BLOBS = 2;
const ERROR_RETRY_MS = 60_000;

const entries = new Map<string, VideoPlaybackCacheEntry>();
const listeners = new Map<string, Set<() => void>>();

function getOrCreateEntry(videoId: string): VideoPlaybackCacheEntry {
  const existing = entries.get(videoId);
  if (existing) {
    return existing;
  }

  const entry: VideoPlaybackCacheEntry = {
    videoId,
    objectUrl: null,
    promise: null,
    sourceUrl: null,
    status: "idle",
    lastAccessedAt: 0,
    lastFailureAt: 0,
  };

  entries.set(videoId, entry);
  return entry;
}

function notify(videoId: string) {
  listeners.get(videoId)?.forEach((listener) => listener());
}

function revokeObjectUrl(entry: VideoPlaybackCacheEntry) {
  if (entry.objectUrl) {
    URL.revokeObjectURL(entry.objectUrl);
    entry.objectUrl = null;
  }
}

function evictLeastRecentlyUsedReadyEntries() {
  const readyEntries = Array.from(entries.values())
    .filter((entry) => entry.status === "ready" && entry.objectUrl)
    .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  while (readyEntries.length > MAX_READY_VIDEO_BLOBS) {
    const next = readyEntries.shift();
    if (!next) break;

    revokeObjectUrl(next);
    next.status = "idle";
    next.lastAccessedAt = 0;
    next.sourceUrl = null;
    entries.delete(next.videoId);
    notify(next.videoId);
  }
}

export function getVideoPlaybackCacheState(videoId: string): {
  objectUrl: string | null;
  status: VideoPlaybackCacheStatus;
} {
  const entry = entries.get(videoId);
  return {
    objectUrl: entry?.objectUrl ?? null,
    status: entry?.status ?? "idle",
  };
}

export function touchVideoPlaybackCache(videoId: string) {
  const entry = entries.get(videoId);
  if (!entry) return;

  entry.lastAccessedAt = Date.now();
}

export function subscribeToVideoPlaybackCache(
  videoId: string,
  listener: () => void,
) {
  const next = listeners.get(videoId) ?? new Set<() => void>();
  next.add(listener);
  listeners.set(videoId, next);

  return () => {
    const current = listeners.get(videoId);
    if (!current) return;

    current.delete(listener);
    if (current.size === 0) {
      listeners.delete(videoId);
    }
  };
}

export function warmVideoPlayback(
  videoId: string,
  sourceUrl: string,
): Promise<string> {
  const entry = getOrCreateEntry(videoId);
  entry.lastAccessedAt = Date.now();

  if (entry.objectUrl) {
    entry.status = "ready";
    return Promise.resolve(entry.objectUrl);
  }

  if (entry.promise) {
    return entry.promise;
  }

  if (
    entry.status === "error" &&
    Date.now() - entry.lastFailureAt < ERROR_RETRY_MS &&
    entry.sourceUrl === sourceUrl
  ) {
    return Promise.reject(new Error("Video cache retry cooldown active"));
  }

  entry.status = "loading";
  entry.sourceUrl = sourceUrl;
  notify(videoId);

  const request = fetch(sourceUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to cache video playback: ${response.status}`);
      }

      return response.blob();
    })
    .then((blob) => {
      const current = getOrCreateEntry(videoId);
      revokeObjectUrl(current);

      current.objectUrl = URL.createObjectURL(blob);
      current.promise = null;
      current.status = "ready";
      current.lastFailureAt = 0;
      current.lastAccessedAt = Date.now();
      notify(videoId);
      evictLeastRecentlyUsedReadyEntries();

      return current.objectUrl;
    })
    .catch((error) => {
      const current = getOrCreateEntry(videoId);
      current.promise = null;
      current.status = current.objectUrl ? "ready" : "error";
      current.lastFailureAt = Date.now();
      notify(videoId);
      throw error;
    });

  entry.promise = request;
  return request;
}