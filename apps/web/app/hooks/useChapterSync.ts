import { useCallback, useEffect, useRef } from "react";
import type {
  WorkerStatusInfo,
  WorkerSseEvent,
} from "~/services/video-worker";
import { useChapterStore, type TaskStatus } from "~/stores/useChapterStore";
import { useSessionStore } from "~/stores/useSessionStore";
import { useWorkerStatus, useWorkerEvent } from "./useWorkerSync";

/** Maps raw status strings from the API to the local union type. */
function normalizeTaskStatus(raw: string): TaskStatus {
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
 * Resolves the task-detection step status from a worker status snapshot.
 * Falls back to inferring from `overallStatus` when no step row exists yet.
 */
function resolveTaskStatus(
  steps: { step: string; status: string }[],
  overallStatus: string | null,
): TaskStatus {
  const taskStep = steps.find((s) => s.step === "task_detection");
  if (taskStep) return normalizeTaskStatus(taskStep.status);

  if (!overallStatus) return "pending";
  if (overallStatus === "processing") return "processing";
  if (overallStatus === "completed" || overallStatus === "processed")
    return "completed";
  if (overallStatus === "failed") return "failed";
  return "pending";
}

/**
 * Monitors task-detection processing status for the active video.
 *
 * Uses the shared worker status + SSE from useWorkerSync to avoid
 * duplicate getStatus calls and SSE connections.
 *
 * @param videoId  - The active video's backend ID, or `undefined` if none.
 * @param viewId   - The active view ID (passed to loadChaptersFromApi).
 */
export function useChapterSync(
  videoId: string | undefined,
  viewId: string | undefined,
) {
  const setTaskStatus = useChapterStore((s) => s.actions.setTaskStatus);
  const loadChaptersFromApi = useChapterStore(
    (s) => s.actions.loadChaptersFromApi,
  );
  const markViewProcessed = useSessionStore(
    (s) => s.actions.markViewProcessed,
  );
  const refreshViewVideoUrl = useSessionStore(
    (s) => s.actions.refreshViewVideoUrl,
  );

  const abortRef = useRef<AbortController | null>(null);

  // Reset on videoId/viewId change.
  useEffect(() => {
    if (!videoId || !viewId) return;

    setTaskStatus("unknown");
    const abort = new AbortController();
    abortRef.current = abort;

    return () => {
      abort.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, viewId]);

  const handleStatus = useCallback(
    (status: WorkerStatusInfo) => {
      if (!videoId || !viewId) return;
      if (abortRef.current?.signal.aborted) return;

      const taskStatus = resolveTaskStatus(status.steps, status.overallStatus);
      setTaskStatus(taskStatus);

      if (status.overallStatus) {
        refreshViewVideoUrl(videoId);
      }

      if (taskStatus === "completed") {
        loadChaptersFromApi(viewId, videoId);
        markViewProcessed(videoId);
      } else if (taskStatus === "failed") {
        markViewProcessed(videoId, true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId, viewId],
  );

  const handleSseEvent = useCallback(
    (event: WorkerSseEvent) => {
      if (!videoId || !viewId) return;
      if (abortRef.current?.signal.aborted) return;

      if (event.type === "step" && event.step === "task_detection") {
        const status = normalizeTaskStatus(event.status ?? "unknown");
        setTaskStatus(status);

        if (status === "completed") {
          loadChaptersFromApi(viewId, videoId);
        }
      }

      if (event.type === "overall") {
        const status = resolveTaskStatus(
          event.steps,
          event.overallStatus,
        );
        setTaskStatus(status);

        if (status === "completed") {
          loadChaptersFromApi(viewId, videoId);
          markViewProcessed(videoId);
          refreshViewVideoUrl(videoId);
        } else if (status === "failed") {
          markViewProcessed(videoId, true);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId, viewId],
  );

  // Register for shared worker status and SSE events.
  useWorkerStatus(videoId, handleStatus);
  useWorkerEvent(videoId, handleSseEvent);
}
