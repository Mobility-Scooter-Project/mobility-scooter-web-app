import { useEffect, useRef, useCallback } from "react";
import { keypointService } from "~/services/keypoints";
import type { WorkerStatusInfo } from "~/services/video-worker";
import { getWorkerStepStatus } from "~/lib/video-worker-status";
import { useKeypointStore, type PoseStatus } from "~/stores/useKeypointStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useWorkerStatus } from "./useWorkerSync";

/** How often to poll `since` while pose estimation is still processing (ms). */
const POLL_INTERVAL_MS = 5_000;

/** Delay between pagination pages to avoid request bursts (ms). */
const PAGE_DELAY_MS = 200;

/** Time-jump threshold to detect a user seek vs. normal playback tick (seconds). */
const SEEK_THRESHOLD_SEC = 1.0;

/** Max rows to fetch per `since` call. */
const SINCE_LIMIT = 2000;

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Orchestrates keypoint data fetching for the active video.
 */
export function useKeypointSync(videoId: string | undefined) {
  const mergeRows = useKeypointStore((state) => state.actions.mergeRows);
  const setPoseStatus = useKeypointStore((state) => state.actions.setPoseStatus);
  const reset = useKeypointStore((state) => state.actions.reset);

  const prevTimeRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bootstrappedRef = useRef(false);
  const lastPoseStatusRef = useRef<PoseStatus>("unknown");

  /** Clears the polling interval. */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Starts interval-based `since` polling for new keypoints. */
  const startPolling = useCallback(
    (vid: string, signal: AbortSignal) => {
      stopPolling();

      pollTimerRef.current = setInterval(async () => {
        if (signal.aborted) {
          stopPolling();
          return;
        }

        const cursor = useKeypointStore.getState().cursor;

        try {
          const rows = await keypointService.getSince(vid, cursor, SINCE_LIMIT);
          if (rows.length > 0) mergeRows(rows);
        } catch (error) {
          console.error("[useKeypointSync] poll failed:", error);
        }
      }, POLL_INTERVAL_MS);
    },
    [mergeRows, stopPolling],
  );

  /** Loads all existing keypoints by paginating through `since`. */
  const paginateAllKeypoints = useCallback(
    async (vid: string, signal: AbortSignal) => {
      let cursor = -1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (signal.aborted) return;

        try {
          const rows = await keypointService.getSince(vid, cursor, SINCE_LIMIT);
          if (rows.length === 0) break;

          mergeRows(rows);
          cursor = rows[rows.length - 1].frameIndex;

          if (rows.length < SINCE_LIMIT) break;

          await delay(PAGE_DELAY_MS);
        } catch (error) {
          console.error("[useKeypointSync] bootstrap pagination failed:", error);
          break;
        }
      }
    },
    [mergeRows],
  );

  const fetchLatestRows = useCallback(
    async (vid: string) => {
      try {
        const rows = await keypointService.getSince(
          vid,
          useKeypointStore.getState().cursor,
          SINCE_LIMIT,
        );
        if (rows.length > 0) {
          mergeRows(rows);
        }
      } catch (error) {
        console.error("[useKeypointSync] latest rows fetch failed:", error);
      }
    },
    [mergeRows],
  );

  const handleStatus = useCallback(
    (status: WorkerStatusInfo) => {
      const signal = abortRef.current?.signal;
      if (!videoId || !signal || signal.aborted) return;

      const poseStatus = resolvePoseStatus(status);
      setPoseStatus(poseStatus);

      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        lastPoseStatusRef.current = poseStatus;

        void paginateAllKeypoints(videoId, signal).then(() => {
          if (signal.aborted) return;
          if (
            poseStatus === "processing" ||
            poseStatus === "pending" ||
            poseStatus === "unknown"
          ) {
            startPolling(videoId, signal);
          }
        });
        return;
      }

      if (
        poseStatus === "processing" ||
        poseStatus === "pending" ||
        poseStatus === "unknown"
      ) {
        startPolling(videoId, signal);
      } else {
        stopPolling();
      }

      const previousStatus = lastPoseStatusRef.current;
      lastPoseStatusRef.current = poseStatus;

      if (
        previousStatus !== poseStatus &&
        (poseStatus === "completed" || poseStatus === "failed")
      ) {
        void fetchLatestRows(videoId);
        stopPolling();
      }
    },
    [fetchLatestRows, paginateAllKeypoints, setPoseStatus, startPolling, stopPolling, videoId],
  );

  useEffect(() => {
    if (!videoId) return;

    reset(videoId);
    bootstrappedRef.current = false;
    lastPoseStatusRef.current = "unknown";

    const abort = new AbortController();
    abortRef.current = abort;

    return () => {
      abort.abort();
      stopPolling();
      abortRef.current = null;
      prevTimeRef.current = null;
      bootstrappedRef.current = false;
      lastPoseStatusRef.current = "unknown";
    };
  }, [reset, stopPolling, videoId]);

  useWorkerStatus(videoId, handleStatus);

  const currentTime = useVideoStore((state) => state.currentTime);

  useEffect(() => {
    if (!videoId) return;

    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;

    if (prev === null || Math.abs(currentTime - prev) < SEEK_THRESHOLD_SEC) return;

    void keypointService
      .getNearest(videoId, currentTime, 2)
      .then((row) => {
        if (row) mergeRows([row]);
      })
      .catch((error) =>
        console.error("[useKeypointSync] nearest fetch failed:", error),
      );
  }, [videoId, currentTime, mergeRows]);
}
