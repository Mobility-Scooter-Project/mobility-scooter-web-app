import { useMemo } from "react";
import type { View } from "~/data/mock-session-data";
import { useChapterSync } from "~/hooks/useChapterSync";
import { useKeypointSync } from "~/hooks/useKeypointSync";
import { useWorkerSync, useWorkerSyncStore } from "~/hooks/useWorkerSync";
import { useKeypointStore } from "~/stores/useKeypointStore";
import { useChapterStore } from "~/stores/useChapterStore";
import type { StepStatus } from "~/components/session/common/PipelineProgress";

export function useVideoPipeline(activeView: View | null) {
  useWorkerSync(activeView?.videoId);
  useKeypointSync(activeView?.videoId);
  useChapterSync(activeView?.videoId, activeView?.id);

  const frames = useKeypointStore((s) => s.frames);
  const poseStatus = useKeypointStore((s) => s.poseStatus);
  const taskStatus = useChapterStore((s) => s.taskStatus);
  const workerStarted = useWorkerSyncStore((s) => s.workerStarted);

  const isUploading = activeView?.uploading ?? false;
  const uploadFailed = activeView?.uploadError ?? false;
  const statusResolved = poseStatus !== "unknown" || taskStatus !== "unknown";

  const pipelineSteps = useMemo(() => {
    let uploadStep: StepStatus = "pending";
    if (uploadFailed) uploadStep = "failed";
    else if (isUploading) uploadStep = "active";
    else if (workerStarted) uploadStep = "completed";
    else if (statusResolved) uploadStep = "active";

    let poseStep: StepStatus = "pending";
    if (uploadStep !== "completed") poseStep = "pending";
    else if (poseStatus === "processing") poseStep = "active";
    else if (poseStatus === "completed") poseStep = "completed";
    else if (poseStatus === "failed") poseStep = "failed";
    else if (poseStatus === "pending" || poseStatus === "unknown") poseStep = "active"; // Treat as active if worker started but no explicit status yet

    let chapterStep: StepStatus = "pending";
    if (uploadStep !== "completed") chapterStep = "pending";
    else if (taskStatus === "processing") chapterStep = "active";
    else if (taskStatus === "completed") chapterStep = "completed";
    else if (taskStatus === "failed") chapterStep = "failed";
    else if (taskStatus === "pending" || taskStatus === "unknown") chapterStep = "active"; // Treat as active if worker started but no explicit status yet

    return [
      { label: "Upload", status: uploadStep },
      { label: "Pose Estimation", status: poseStep },
      { label: "Chapters", status: chapterStep },
    ];
  }, [isUploading, uploadFailed, poseStatus, taskStatus, statusResolved, workerStarted]);

  // Hide the pipeline progress once all steps reach a terminal state (completed or failed)
  const pipelineVisible = pipelineSteps.some(
    (s) => s.status === "pending" || s.status === "active"
  );

  return { pipelineSteps, pipelineVisible, frames };
}