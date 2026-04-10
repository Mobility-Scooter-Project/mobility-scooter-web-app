import { useEffect, useRef, useCallback } from "react";
import { keypointService } from "~/services/keypoints";
import type { WorkerSseEvent } from "~/services/video-worker";
import type { WorkerStatusInfo } from "~/services/video-worker";
import { useKeypointStore, type PoseStatus } from "~/stores/useKeypointStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useWorkerStatus, useWorkerEvent } from "./useWorkerSync";

/** How often to poll `since` while pose estimation is still processing (ms). */
const POLL_INTERVAL_MS = 5_000;

/** Delay between pagination pages to avoid request bursts (ms). */
const PAGE_DELAY_MS = 200;

/** Time-jump threshold to detect a user seek vs. normal playback tick (seconds). */
const SEEK_THRESHOLD_SEC = 1.0;

/** Max rows to fetch per `since` call. */
const SINCE_LIMIT = 2000;

/**
 * Resolves the pose-estimation step status from a worker status snapshot.
 * Falls back to inferring from `overallStatus` when no step row exists yet.
 */
function resolvePoseStatus(steps: { step: string; status: string }[], overallStatus: string | null): PoseStatus {
  const poseStep = steps.find((s) => s.step === "pose_estimation");
  if (poseStep) return normalizePoseStatus(poseStep.status);

  // No step row yet — infer from overall status.
  if (!overallStatus) return "pending";
  if (overallStatus === "processing") return "processing";
  if (overallStatus === "completed" || overallStatus === "processed") return "completed";
  if (overallStatus === "failed") return "failed";
  return "pending";
}

/** Maps raw status strings from the API to our local union type. */
function normalizePoseStatus(raw: string): PoseStatus {
  switch (raw) {
    case "completed":
    case "processed":
      return "completed";
    case "processing":
      return "processing";
    case "failed":
      return "failed";
    case "pending":
    case "queued":
      return "pending";
    default:
      return "unknown";
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Orchestrates keypoint data fetching for the active video.
 *
 * Uses the shared worker status + SSE from useWorkerSync to avoid
 * duplicate getStatus calls and SSE connections.
 *
 * @param videoId - The active video's backend ID, or `undefined` if none.
 */
export function useKeypointSync(videoId: string | undefined) {
  const mergeRows = useKeypointStore((s) => s.actions.mergeRows);
  const setPoseStatus = useKeypointStore((s) => s.actions.setPoseStatus);
  const reset = useKeypointStore((s) => s.actions.reset);

  const prevTimeRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
        } catch (err) {
          console.error("[useKeypointSync] poll failed:", err);
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

          // If we got fewer than the limit, we've reached the end.
          if (rows.length < SINCE_LIMIT) break;

          // Throttle between pages to avoid request bursts.
          await delay(PAGE_DELAY_MS);
        } catch (err) {
          console.error("[useKeypointSync] bootstrap pagination failed:", err);
          break;
        }
      }
    },
    [mergeRows],
  );

  // --- Bootstrap: wait for shared status, load keypoints, subscribe events ---
  const handleStatus = useCallback(
    (status: WorkerStatusInfo) => {
      const vid = abortRef.current ? videoId : undefined;
      if (!vid) return;
      const signal = abortRef.current!.signal;
      if (signal.aborted) return;

      const poseStatus = resolvePoseStatus(status.steps, status.overallStatus);
      setPoseStatus(poseStatus);

      // Bootstrap keypoints then start polling if still processing.
      paginateAllKeypoints(vid, signal).then(() => {
        if (signal.aborted) return;
        if (
          poseStatus === "processing" ||
          poseStatus === "pending" ||
          poseStatus === "unknown"
        ) {
          startPolling(vid, signal);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId, setPoseStatus, paginateAllKeypoints, startPolling],
  );

  const handleSseEvent = useCallback(
    (event: WorkerSseEvent) => {
      const vid = videoId;
      const signal = abortRef.current?.signal;
      if (!vid || !signal || signal.aborted) return;

      if (event.type === "step" && event.step === "pose_estimation") {
        const status = normalizePoseStatus(event.status ?? "unknown");
        setPoseStatus(status);

        if (status === "completed" || status === "failed") {
          keypointService
            .getSince(vid, useKeypointStore.getState().cursor, SINCE_LIMIT)
            .then((rows) => {
              if (rows.length > 0) mergeRows(rows);
            })
            .catch(() => {})
            .finally(stopPolling);
        }
      }

      if (event.type === "overall") {
        const status = resolvePoseStatus(event.steps, event.overallStatus);
        setPoseStatus(status);

        if (status === "completed" || status === "failed") {
          stopPolling();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId, mergeRows, setPoseStatus, stopPolling],
  );

  // Reset store and abort controller when videoId changes.
  useEffect(() => {
    if (!videoId) return;

    reset(videoId);
    const abort = new AbortController();
    abortRef.current = abort;

    return () => {
      abort.abort();
      stopPolling();
      abortRef.current = null;
      prevTimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Register for shared worker status and SSE events.
  useWorkerStatus(videoId, handleStatus);
  useWorkerEvent(videoId, handleSseEvent);

  // --- Seek detection: call `nearest` on large time jumps ---
  const currentTime = useVideoStore((s) => s.currentTime);

  useEffect(() => {
    if (!videoId) return;

    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;

    // Skip the initial mount and small playback ticks.
    if (prev === null || Math.abs(currentTime - prev) < SEEK_THRESHOLD_SEC) return;

    // User seeked — fetch nearest keypoint for instant overlay.
    keypointService
      .getNearest(videoId, currentTime, 2)
      .then((row) => {
        if (row) mergeRows([row]);
      })
      .catch((err) =>
        console.error("[useKeypointSync] nearest fetch failed:", err),
      );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, currentTime]);
}
