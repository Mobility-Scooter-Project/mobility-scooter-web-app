import { useEffect, useRef, useCallback } from "react";
import { keypointService } from "~/services/keypoints";
import {
  videoWorkerService,
  type WorkerSseEvent,
} from "~/services/video-worker";
import { useKeypointStore, type PoseStatus } from "~/stores/useKeypointStore";
import { useVideoStore } from "~/stores/useVideoStore";

/** How often to poll `since` while pose estimation is still processing (ms). */
const POLL_INTERVAL_MS = 2_000;

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

/**
 * Orchestrates keypoint data fetching for the active video.
 *
 * **Responsibilities:**
 * 1. Fetches initial worker status and determines pose-estimation state.
 * 2. Subscribes to SSE for real-time status updates while processing.
 * 3. Polls `/since` to incrementally load new keypoint rows.
 * 4. Calls `/nearest` on user seeks for instant overlay feedback.
 * 5. Paginated bootstrap: loads all existing keypoints on mount.
 *
 * All fetched data is merged into `useKeypointStore`.
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

  // --- Bootstrap: fetch status, load existing keypoints, subscribe SSE ---
  useEffect(() => {
    if (!videoId) return;

    reset(videoId);
    const abort = new AbortController();
    abortRef.current = abort;

    let cleanupSse: (() => void) | null = null;

    (async () => {
      if (abort.signal.aborted) return;

      // 1. Fetch worker status snapshot.
      let poseStatus: PoseStatus = "unknown";
      try {
        const status = await videoWorkerService.getStatus(videoId);
        poseStatus = resolvePoseStatus(status.steps, status.overallStatus);
        setPoseStatus(poseStatus);
      } catch (err) {
        console.error("[useKeypointSync] Failed to fetch worker status:", err);
        // Continue anyway — we'll try to load keypoints regardless.
      }

      if (abort.signal.aborted) return;

      // 2. Bootstrap: paginate through all existing keypoints.
      await paginateAllKeypoints(videoId, abort.signal);

      if (abort.signal.aborted) return;

      // 3. If still processing, start polling and subscribe to SSE.
      if (poseStatus === "processing" || poseStatus === "pending" || poseStatus === "unknown") {
        startPolling(videoId, abort.signal);

        cleanupSse = videoWorkerService.subscribeToEvents(
          videoId,
          (event) => handleSseEvent(event, videoId, abort.signal),
        );
      }
    })();

    return () => {
      abort.abort();
      stopPolling();
      cleanupSse?.();
      abortRef.current = null;
      prevTimeRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

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

  // --- Internal helpers ---

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
        } catch (err) {
          console.error("[useKeypointSync] bootstrap pagination failed:", err);
          break;
        }
      }
    },
    [mergeRows],
  );

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
    [mergeRows],
  );

  /** Clears the polling interval. */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Handles incoming SSE events and updates store state. */
  const handleSseEvent = useCallback(
    (event: WorkerSseEvent, vid: string, signal: AbortSignal) => {
      if (signal.aborted) return;

      if (event.type === "step" && event.step === "pose_estimation") {
        const status = normalizePoseStatus(event.status ?? "unknown");
        setPoseStatus(status);

        if (status === "completed" || status === "failed") {
          // Do a final fetch to pick up any remaining rows, then stop polling.
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
        const status = resolvePoseStatus(
          event.steps,
          event.overallStatus,
        );
        setPoseStatus(status);

        if (status === "completed" || status === "failed") {
          stopPolling();
        }
      }
    },
    [mergeRows, setPoseStatus, stopPolling],
  );
}
