import { useMemo } from "react";
import type { View } from "~/data/mock-session-data";
import { useChapterSync } from "~/hooks/useChapterSync";
import { useKeypointSync } from "~/hooks/useKeypointSync";
import { useWorkerSync, useWorkerSyncStore } from "~/hooks/useWorkerSync";
import { useKeypointStore } from "~/stores/useKeypointStore";
import { useChapterStore } from "~/stores/useChapterStore";
import type { StepStatus } from "~/components/session/common/PipelineProgress";

function formatStepLabel(
  baseLabel: string,
  status: "unknown" | "pending" | "processing" | "completed" | "failed",
): string {
  if (status === "pending" || status === "unknown") {
    return `${baseLabel} queued`;
  }

  if (status === "processing") {
    return `${baseLabel} in progress`;
  }

  return baseLabel;
}

export function useVideoPipeline(activeView: View | null) {
  useWorkerSync(activeView?.videoId);
  useKeypointSync(activeView?.videoId);
  useChapterSync(activeView?.videoId, activeView?.id);

  const frames = useKeypointStore((state) => state.frames);
  const poseStatus = useKeypointStore((state) => state.poseStatus);
  const taskStatus = useChapterStore((state) => state.taskStatus);
  const workerStarted = useWorkerSyncStore((state) => state.workerStarted);

  const isUploading = activeView?.uploading ?? false;
  const uploadFailed = activeView?.uploadError ?? false;
  const hasLocalPreview = Boolean(activeView?.videoUrl?.startsWith("blob:"));
  const statusResolved = poseStatus !== "unknown" || taskStatus !== "unknown";
  const shouldTrackPipeline =
    isUploading || uploadFailed || workerStarted || statusResolved || hasLocalPreview;

  const pipelineSteps = useMemo(() => {
    let uploadStep: StepStatus = "pending";
    if (uploadFailed) uploadStep = "failed";
    else if (isUploading) uploadStep = "active";
    else if (workerStarted) uploadStep = "completed";
    else if (hasLocalPreview || statusResolved) uploadStep = "active";

    let poseStep: StepStatus = "pending";
    if (uploadStep !== "completed") poseStep = "pending";
    else if (poseStatus === "processing") poseStep = "active";
    else if (poseStatus === "completed") poseStep = "completed";
    else if (poseStatus === "failed") poseStep = "failed";
    else if (poseStatus === "pending" || poseStatus === "unknown") poseStep = "active";

    let chapterStep: StepStatus = "pending";
    if (uploadStep !== "completed") chapterStep = "pending";
    else if (taskStatus === "processing") chapterStep = "active";
    else if (taskStatus === "completed") chapterStep = "completed";
    else if (taskStatus === "failed") chapterStep = "failed";
    else if (taskStatus === "pending" || taskStatus === "unknown") chapterStep = "active";

    return [
      {
        label:
          uploadFailed || isUploading || hasLocalPreview
            ? "Upload"
            : "Upload complete",
        status: uploadStep,
      },
      {
        label: formatStepLabel("Pose Estimation", poseStatus),
        status: poseStep,
      },
      {
        label: formatStepLabel("Chapter Detection", taskStatus),
        status: chapterStep,
      },
    ];
  }, [hasLocalPreview, isUploading, poseStatus, statusResolved, taskStatus, uploadFailed, workerStarted]);

  const pipelineVisible =
    shouldTrackPipeline &&
    pipelineSteps.some((step) => step.status === "pending" || step.status === "active");

  return { pipelineSteps, pipelineVisible, frames };
}
