import { useEffect, useRef } from "react";
import {
  videoWorkerService,
  type WorkerStatusInfo,
  type WorkerSseEvent,
} from "~/services/video-worker";
import { create } from "zustand";

type WorkerSyncListener = (event: WorkerSseEvent) => void;
type StatusListener = (status: WorkerStatusInfo) => void;

/**
 * Tiny store that caches the latest worker status per video so that
 * multiple hooks can share one getStatus call and one SSE connection.
 */

/** How often to re-check worker status while the worker hasn't started (ms). */
const STATUS_POLL_MS = 5_000;

type WorkerSyncState = {
  /** The videoId currently being tracked. */
  videoId: string | null;
  /** Cached initial status snapshot (set once on mount). */
  initialStatus: WorkerStatusInfo | null;
  /** True once the worker has acknowledged the video (overallStatus non-null). */
  workerStarted: boolean;
  /** Registered listeners for SSE events. */
  sseListeners: Set<WorkerSyncListener>;
  /** Registered listeners for the initial status fetch. */
  statusListeners: Set<StatusListener>;
};

export const useWorkerSyncStore = create<WorkerSyncState>(() => ({
  videoId: null,
  initialStatus: null,
  workerStarted: false,
  sseListeners: new Set(),
  statusListeners: new Set(),
}));

/**
 * Manages a single getStatus call + SSE connection per video.
 * Other hooks register listeners via useWorkerEvent / useWorkerStatus.
 *
 * Call this once in the component tree for the active video.
 */
export function useWorkerSync(videoId: string | undefined) {
  useEffect(() => {
    if (!videoId) return;

    const store = useWorkerSyncStore;
    store.setState({ videoId, initialStatus: null, workerStarted: false });

    const abort = new AbortController();
    let cleanupSse: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    /** Notify all registered status listeners with the given snapshot. */
    const notifyStatusListeners = (status: WorkerStatusInfo) => {
      for (const cb of store.getState().statusListeners) {
        cb(status);
      }
    };

    (async () => {
      if (abort.signal.aborted) return;

      // Single getStatus call shared by all consumers.
      try {
        const status = await videoWorkerService.getStatus(videoId);
        if (abort.signal.aborted) return;

        const started = status.overallStatus !== null;
        store.setState({ initialStatus: status, workerStarted: started });
        notifyStatusListeners(status);

        // If the worker hasn't started yet (video may still be uploading),
        // poll periodically until the worker acknowledges the video.
        if (!started && !abort.signal.aborted) {
          pollTimer = setInterval(async () => {
            if (abort.signal.aborted) {
              if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
              return;
            }
            try {
              const updated = await videoWorkerService.getStatus(videoId);
              if (abort.signal.aborted) return;
              if (updated.overallStatus !== null) {
                store.setState({ initialStatus: updated, workerStarted: true });
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                // Re-notify so hooks like useChapterSync can refresh the video URL.
                notifyStatusListeners(updated);
              }
            } catch (err) {
              console.error("[useWorkerSync] status poll failed:", err);
            }
          }, STATUS_POLL_MS);
        }
      } catch (err) {
        console.error("[useWorkerSync] Failed to fetch status:", err);
      }

      if (abort.signal.aborted) return;

      // Single SSE connection shared by all consumers.
      cleanupSse = videoWorkerService.subscribeToEvents(videoId, (event) => {
        if (abort.signal.aborted) return;
        // Any SSE event means the worker has started processing.
        if (!store.getState().workerStarted) {
          store.setState({ workerStarted: true });
          if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        }
        for (const cb of store.getState().sseListeners) {
          cb(event);
        }
      });
    })();

    return () => {
      abort.abort();
      cleanupSse?.();
      if (pollTimer) clearInterval(pollTimer);
      store.setState({
        videoId: null,
        initialStatus: null,
        workerStarted: false,
        sseListeners: new Set(),
        statusListeners: new Set(),
      });
    };
  }, [videoId]);
}

/**
 * Registers a callback for the initial worker status fetch.
 * Uses a ref so the latest callback is always invoked, even if
 * the status was already fetched before this hook mounted.
 */
export function useWorkerStatus(
  videoId: string | undefined,
  callback: StatusListener,
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!videoId) return;

    const store = useWorkerSyncStore;

    // Wrap in a stable function so we can reliably remove it later.
    const listener: StatusListener = (status) => cbRef.current(status);

    // If already fetched for this video, call immediately.
    const state = store.getState();
    if (state.initialStatus && state.videoId === videoId) {
      listener(state.initialStatus);
    }

    // Register for future updates (in case fetch hasn't completed yet).
    state.statusListeners.add(listener);
    return () => {
      store.getState().statusListeners.delete(listener);
    };
  }, [videoId]);
}

/**
 * Registers a callback for SSE events from the shared connection.
 * Uses a ref so the latest callback is always invoked.
 */
export function useWorkerEvent(
  videoId: string | undefined,
  callback: WorkerSyncListener,
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!videoId) return;

    const store = useWorkerSyncStore;
    const listener: WorkerSyncListener = (event) => cbRef.current(event);

    store.getState().sseListeners.add(listener);
    return () => {
      store.getState().sseListeners.delete(listener);
    };
  }, [videoId]);
}
