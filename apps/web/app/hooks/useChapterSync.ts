import { useCallback, useEffect, useRef } from "react";
import type { WorkerStatusInfo } from "~/services/video-worker";
import { getWorkerStepStatus } from "~/lib/video-worker-status";
import { useChapterStore, type TaskStatus } from "~/stores/useChapterStore";
import { useSessionStore } from "~/stores/useSessionStore";
import { useWorkerStatus } from "./useWorkerSync";

function normalizeTaskStatus(raw: ReturnType<typeof getWorkerStepStatus>): TaskStatus {
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

function resolveTaskStatus(status: WorkerStatusInfo): TaskStatus {
  return normalizeTaskStatus(getWorkerStepStatus(status, "task_detection"));
}

/**
 * Monitors task-detection processing status for the active video.
 */
export function useChapterSync(
  videoId: string | undefined,
  viewId: string | undefined,
) {
  const setTaskStatus = useChapterStore((state) => state.actions.setTaskStatus);
  const loadChaptersFromApi = useChapterStore(
    (state) => state.actions.loadChaptersFromApi,
  );
  const markViewProcessed = useSessionStore(
    (state) => state.actions.markViewProcessed,
  );

  const abortRef = useRef<AbortController | null>(null);
  const lastTaskStatusRef = useRef<TaskStatus>("unknown");

  useEffect(() => {
    if (!videoId || !viewId) return;

    setTaskStatus("unknown");
    lastTaskStatusRef.current = "unknown";

    const abort = new AbortController();
    abortRef.current = abort;

    return () => {
      abort.abort();
      abortRef.current = null;
      lastTaskStatusRef.current = "unknown";
    };
  }, [videoId, viewId, setTaskStatus]);

  const handleStatus = useCallback(
    (status: WorkerStatusInfo) => {
      if (!videoId || !viewId) return;
      if (abortRef.current?.signal.aborted) return;

      const taskStatus = resolveTaskStatus(status);
      setTaskStatus(taskStatus);

      const previousStatus = lastTaskStatusRef.current;
      lastTaskStatusRef.current = taskStatus;

      if (taskStatus === "completed" && previousStatus !== "completed") {
        void loadChaptersFromApi(viewId, videoId);
        markViewProcessed(videoId);
      } else if (taskStatus === "failed" && previousStatus !== "failed") {
        markViewProcessed(videoId, true);
      }
    },
    [videoId, viewId, loadChaptersFromApi, markViewProcessed, setTaskStatus],
  );

  useWorkerStatus(videoId, handleStatus);
}
