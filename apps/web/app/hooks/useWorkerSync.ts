import { useEffect, useRef } from "react";
import {
  videoWorkerService,
  type WorkerStatusInfo,
  type WorkerSseEvent,
} from "~/services/video-worker";
import { create } from "zustand";
import { isWorkerStarted, isWorkerTerminal } from "~/lib/video-worker-status";
import { userAuthStore } from "~/lib/auth";

type WorkerSyncListener = (event: WorkerSseEvent) => void;
type StatusListener = (status: WorkerStatusInfo) => void;

/** How often to re-check worker status while processing is in flight (ms). */
const STATUS_POLL_MS = 5_000;

type WorkerSyncState = {
  /** The videoId currently being tracked. */
  videoId: string | null;
  /** Cached latest status snapshot. */
  latestStatus: WorkerStatusInfo | null;
  /** True once the worker has acknowledged the video. */
  workerStarted: boolean;
  /** Registered listeners for SSE events. */
  sseListeners: Set<WorkerSyncListener>;
  /** Registered listeners for status snapshots. */
  statusListeners: Set<StatusListener>;
};

export const useWorkerSyncStore = create<WorkerSyncState>(() => ({
  videoId: null,
  latestStatus: null,
  workerStarted: false,
  sseListeners: new Set(),
  statusListeners: new Set(),
}));

function mergeWorkerEvent(
  current: WorkerStatusInfo | null,
  event: WorkerSseEvent,
): WorkerStatusInfo {
  if (event.type === "step") {
    const steps = current?.steps ?? [];
    const existingIndex = steps.findIndex((step) => step.step === event.step);
    const nextSteps = [...steps];
    const nextStep = {
      step: event.step,
      status: event.status ?? "pending",
    };

    if (existingIndex === -1) {
      nextSteps.push(nextStep);
    } else {
      nextSteps[existingIndex] = nextStep;
    }

    return {
      videoId: event.videoId,
      overallStatus: current?.overallStatus ?? null,
      durationSec: current?.durationSec ?? null,
      steps: nextSteps,
    };
  }

  return {
    videoId: event.videoId,
    overallStatus: event.overallStatus,
    durationSec: event.durationSec,
    steps: current?.steps ?? [],
  };
}

/**
 * Manages a single getStatus call + SSE connection per video.
 * Other hooks register listeners via useWorkerEvent / useWorkerStatus.
 */
export function useWorkerSync(videoId: string | undefined) {
  const accessToken = userAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!videoId) return;

    const store = useWorkerSyncStore;
    store.setState({ videoId, latestStatus: null, workerStarted: false });

    const abort = new AbortController();
    let cleanupSse: (() => void) | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let activeRefresh: Promise<void> | null = null;
    let queuedRefresh = false;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer || abort.signal.aborted) return;
      pollTimer = setInterval(() => {
        void refreshStatus();
      }, STATUS_POLL_MS);
    };

    const notifyStatusListeners = (status: WorkerStatusInfo) => {
      for (const callback of store.getState().statusListeners) {
        callback(status);
      }
    };

    const applyStatus = (status: WorkerStatusInfo) => {
      const started = isWorkerStarted(status);
      store.setState({ latestStatus: status, workerStarted: started });
      notifyStatusListeners(status);

      if (isWorkerTerminal(status)) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    const refreshStatus = async () => {
      if (abort.signal.aborted) return;
      if (activeRefresh) {
        queuedRefresh = true;
        return activeRefresh;
      }

      activeRefresh = (async () => {
        try {
          do {
            queuedRefresh = false;

            try {
              const status = await videoWorkerService.getStatus(videoId);
              if (abort.signal.aborted) return;
              applyStatus(status);
            } catch (error) {
              if (!abort.signal.aborted) {
                console.error("[useWorkerSync] Failed to fetch status:", error);
              }
            }
          } while (queuedRefresh && !abort.signal.aborted);
        } finally {
          activeRefresh = null;
        }
      })();

      return activeRefresh;
    };

    startPolling();
    void refreshStatus();

    cleanupSse = videoWorkerService.subscribeToEvents(
      videoId,
      (event) => {
        if (abort.signal.aborted) return;

        const merged = mergeWorkerEvent(store.getState().latestStatus, event);
        applyStatus(merged);

        for (const callback of store.getState().sseListeners) {
          callback(event);
        }

        void refreshStatus();
      },
      (error) => {
        if (!abort.signal.aborted) {
          console.error("[useWorkerSync] SSE connection error:", error);
        }
      },
    );

    return () => {
      abort.abort();
      cleanupSse?.();
      stopPolling();
      store.setState({
        videoId: null,
        latestStatus: null,
        workerStarted: false,
        sseListeners: new Set(),
        statusListeners: new Set(),
      });
    };
  }, [accessToken, videoId]);
}

/**
 * Registers a callback for status snapshots.
 * Uses a ref so the latest callback is always invoked.
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
    const listener: StatusListener = (status) => cbRef.current(status);

    const state = store.getState();
    if (state.latestStatus && state.videoId === videoId) {
      listener(state.latestStatus);
    }

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
