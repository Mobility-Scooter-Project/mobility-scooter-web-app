import { useCallback, useEffect, useRef } from "react";
import { keypointService } from "~/services/keypoints";
import type { WorkerStatusInfo } from "~/services/video-worker";
import { getWorkerStepStatus } from "~/lib/video-worker-status";
import { useKeypointStore, type PoseStatus } from "~/stores/useKeypointStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useWorkerStatus } from "./useWorkerSync";

/** How often to background-poll `since` while pose estimation is still processing (ms). */
const BACKGROUND_POLL_MS = 3_000;

/** Delay between paginated `since` requests to avoid bursty loops (ms). */
const PAGE_DELAY_MS = 100;

/** Max rows requested per `since` call. The API may still apply a lower server cap. */
const SINCE_LIMIT = 5_000;

/** Fetch a new `since` batch before playback hits the contiguous buffered edge. */
const PLAYHEAD_PREFETCH_WINDOW_SEC = 2.5;

/** Minimum spacing between incremental `since` refreshes (ms). */
const MIN_FETCH_GAP_MS = 750;

/** Back off after an empty or tiny incremental batch while pose streaming is still in flight (ms). */
const STREAMING_BATCH_COOLDOWN_MS = 2_250;

/** Minimum timestamp coverage gain that counts as a meaningful incremental batch while streaming (sec). */
const MIN_STREAMING_BATCH_COVERAGE_SEC = 2;

function normalizePoseStatus(raw: ReturnType<typeof getWorkerStepStatus>): PoseStatus {
  switch (raw) {
    case "completed":
      return "completed";
    case "processing":
      return "processing";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

function resolvePoseStatus(status: WorkerStatusInfo): PoseStatus {
  return normalizePoseStatus(getWorkerStepStatus(status, "pose_estimation"));
}

function isPoseStreaming(status: PoseStatus): boolean {
  return status === "processing" || status === "pending" || status === "unknown";
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SinceRequestOptions = {
  /** Keep paging until the API returns no more rows. */
  drainToEmpty?: boolean;
  /** Keep paging until contiguous coverage reaches this timestamp. */
  targetTimestamp?: number;
  /** Bypass short request-spacing throttles. */
  force?: boolean;
};

export function useKeypointSync(videoId: string | undefined) {
  const mergeRows = useKeypointStore((state) => state.actions.mergeRows);
  const setPoseStatus = useKeypointStore((state) => state.actions.setPoseStatus);
  const reset = useKeypointStore((state) => state.actions.reset);

  const isPlaying = useVideoStore((state) => state.isPlaying);
  const currentTime = useVideoStore((state) => state.currentTime);
  const seekRequestId = useVideoStore((state) => state.seekRequestId);
  const lastSeekTime = useVideoStore((state) => state.lastSeekTime);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bootstrapCompleteRef = useRef(false);
  const lastPoseStatusRef = useRef<PoseStatus>("unknown");
  const activeSyncPromiseRef = useRef<Promise<boolean> | null>(null);
  const pendingDrainToEmptyRef = useRef(false);
  const pendingTargetTimestampRef = useRef<number | null>(null);
  const pendingForceRef = useRef(false);
  const lastSinceRequestAtRef = useRef(0);
  const fetchCooldownUntilRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const syncSince = useCallback(
    async (vid: string, options?: SinceRequestOptions): Promise<boolean> => {
      const signal = abortRef.current?.signal;
      if (!signal || signal.aborted) return false;

      if (options?.drainToEmpty) {
        pendingDrainToEmptyRef.current = true;
      }

      if (typeof options?.targetTimestamp === "number") {
        pendingTargetTimestampRef.current =
          pendingTargetTimestampRef.current === null
            ? options.targetTimestamp
            : Math.max(pendingTargetTimestampRef.current, options.targetTimestamp);
      }

      if (options?.force) {
        pendingForceRef.current = true;
      }

      if (activeSyncPromiseRef.current) {
        return activeSyncPromiseRef.current;
      }

      const now = Date.now();
      if (!pendingForceRef.current) {
        if (now - lastSinceRequestAtRef.current < MIN_FETCH_GAP_MS) {
          return false;
        }

        if (now < fetchCooldownUntilRef.current) {
          return false;
        }
      }

      const request = (async () => {
        let receivedAny = false;

        while (!signal.aborted) {
          const shouldDrainToEmpty = pendingDrainToEmptyRef.current;
          const targetTimestamp = pendingTargetTimestampRef.current;
          const { cursor, cursorTimestamp } = useKeypointStore.getState();

          if (!shouldDrainToEmpty && targetTimestamp !== null && cursorTimestamp >= targetTimestamp) {
            pendingTargetTimestampRef.current = null;
            pendingForceRef.current = false;
            break;
          }

          const rows = await keypointService.getSince(vid, cursor, SINCE_LIMIT);
          lastSinceRequestAtRef.current = Date.now();
          if (signal.aborted) return receivedAny;

          if (rows.length === 0) {
            if (!receivedAny) {
              fetchCooldownUntilRef.current =
                Date.now() + STREAMING_BATCH_COOLDOWN_MS;
            }
            pendingDrainToEmptyRef.current = false;
            pendingTargetTimestampRef.current = null;
            pendingForceRef.current = false;
            break;
          }

          const lastRow = rows[rows.length - 1];
          if (lastRow.frameIndex <= cursor) {
            console.warn("[useKeypointSync] since response did not advance cursor; stopping pagination to avoid a loop.");
            pendingDrainToEmptyRef.current = false;
            pendingTargetTimestampRef.current = null;
            pendingForceRef.current = false;
            break;
          }

          const coverageGainSec = Math.max(
            0,
            lastRow.timestamp - cursorTimestamp,
          );

          mergeRows(rows, { advanceCursor: true });
          receivedAny = true;
          fetchCooldownUntilRef.current = 0;

          if (
            isPoseStreaming(lastPoseStatusRef.current) &&
            coverageGainSec < MIN_STREAMING_BATCH_COVERAGE_SEC
          ) {
            fetchCooldownUntilRef.current =
              Date.now() + STREAMING_BATCH_COOLDOWN_MS;
            pendingDrainToEmptyRef.current = false;
            pendingTargetTimestampRef.current = null;
            pendingForceRef.current = false;
            break;
          }

          await delay(PAGE_DELAY_MS);
        }

        return receivedAny;
      })()
        .catch((error) => {
          if (!signal.aborted) {
            console.error("[useKeypointSync] since sync failed:", error);
          }
          return false;
        })
        .finally(() => {
          if (activeSyncPromiseRef.current === request) {
            activeSyncPromiseRef.current = null;
          }
        });

      activeSyncPromiseRef.current = request;
      return request;
    },
    [mergeRows],
  );

  const startPolling = useCallback(
    (vid: string) => {
      if (pollTimerRef.current) {
        return;
      }

      pollTimerRef.current = setInterval(() => {
        if (abortRef.current?.signal.aborted) {
          stopPolling();
          return;
        }

        void syncSince(vid, { drainToEmpty: true });
      }, BACKGROUND_POLL_MS);
    },
    [stopPolling, syncSince],
  );

  const handleStatus = useCallback(
    (status: WorkerStatusInfo) => {
      if (!videoId || abortRef.current?.signal.aborted) return;

      const poseStatus = resolvePoseStatus(status);
      const previousStatus = lastPoseStatusRef.current;

      lastPoseStatusRef.current = poseStatus;
      setPoseStatus(poseStatus);

      if (bootstrapCompleteRef.current) {
        if (isPoseStreaming(poseStatus)) {
          startPolling(videoId);
        } else {
          stopPolling();
        }
      }

      if (
        previousStatus !== poseStatus &&
        (poseStatus === "completed" || poseStatus === "failed")
      ) {
        void syncSince(videoId, { drainToEmpty: true, force: true });
        stopPolling();
      }
    },
    [setPoseStatus, startPolling, stopPolling, syncSince, videoId],
  );

  useEffect(() => {
    if (!videoId) return;

    reset(videoId);
    bootstrapCompleteRef.current = false;
    lastPoseStatusRef.current = "unknown";
    pendingDrainToEmptyRef.current = false;
    pendingTargetTimestampRef.current = null;
    pendingForceRef.current = false;
    activeSyncPromiseRef.current = null;
    lastSinceRequestAtRef.current = 0;
    fetchCooldownUntilRef.current = 0;

    const abort = new AbortController();
    abortRef.current = abort;

    void syncSince(videoId, { drainToEmpty: true, force: true }).finally(() => {
      if (abort.signal.aborted) return;

      bootstrapCompleteRef.current = true;
      if (isPoseStreaming(lastPoseStatusRef.current)) {
        startPolling(videoId);
      }
    });

    return () => {
      abort.abort();
      stopPolling();
      abortRef.current = null;
      bootstrapCompleteRef.current = false;
      lastPoseStatusRef.current = "unknown";
      pendingDrainToEmptyRef.current = false;
      pendingTargetTimestampRef.current = null;
      pendingForceRef.current = false;
      activeSyncPromiseRef.current = null;
      lastSinceRequestAtRef.current = 0;
      fetchCooldownUntilRef.current = 0;
    };
  }, [reset, startPolling, stopPolling, syncSince, videoId]);

  useWorkerStatus(videoId, handleStatus);

  useEffect(() => {
    if (!videoId || !isPlaying || !bootstrapCompleteRef.current) return;
    if (!isPoseStreaming(lastPoseStatusRef.current)) return;

    const coverageEnd = useKeypointStore.getState().cursorTimestamp;
    if (coverageEnd < 0 || currentTime >= coverageEnd - PLAYHEAD_PREFETCH_WINDOW_SEC) {
      void syncSince(videoId, {
        targetTimestamp: currentTime + PLAYHEAD_PREFETCH_WINDOW_SEC,
      });
    }
  }, [currentTime, isPlaying, syncSince, videoId]);

  useEffect(() => {
    if (!videoId || seekRequestId === 0) return;
    if (abortRef.current?.signal.aborted) return;

    const requestedTime = lastSeekTime;

    void keypointService
      .getNearest(videoId, requestedTime, 2)
      .then((row) => {
        if (abortRef.current?.signal.aborted) return;

        if (row) {
          mergeRows([row], { advanceCursor: false });
        }

        void syncSince(videoId, {
          targetTimestamp: requestedTime + PLAYHEAD_PREFETCH_WINDOW_SEC,
          force: true,
        });
      })
      .catch((error) => {
        console.error("[useKeypointSync] nearest fetch failed:", error);
        void syncSince(videoId, {
          targetTimestamp: requestedTime + PLAYHEAD_PREFETCH_WINDOW_SEC,
          force: true,
        });
      });
  }, [lastSeekTime, mergeRows, seekRequestId, syncSince, videoId]);
}
