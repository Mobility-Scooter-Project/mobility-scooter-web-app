import { useMemo } from "react";
import type { StepStatus } from "~/components/session/common/PipelineProgress";
import type { View } from "~/data/mock-session-data";
import { useChapterSync } from "~/hooks/useChapterSync";
import { useKeypointSync } from "~/hooks/useKeypointSync";
import { useWorkerSync, useWorkerSyncStore } from "~/hooks/useWorkerSync";
import { useChapterStore } from "~/stores/useChapterStore";
import { useKeypointStore } from "~/stores/useKeypointStore";

function formatStepLabel(baseLabel: string, status: StepStatus): string {
  if (status === "pending") {
    return `${baseLabel} queued`;
  }

  if (status === "active") {
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
  const hasUploadedVideo = Boolean(activeView?.videoId) && !isUploading;
  const statusResolved = poseStatus !== "unknown" || taskStatus !== "unknown";
  const shouldTrackPipeline =
    isUploading ||
    uploadFailed ||
    workerStarted ||
    statusResolved ||
    hasLocalPreview;

  const pipelineSteps = useMemo(() => {
    let uploadStep: StepStatus = "pending";
    if (uploadFailed) uploadStep = "failed";
    else if (isUploading) uploadStep = "active";
    else if (hasUploadedVideo || workerStarted || hasLocalPreview || statusResolved) {
      uploadStep = "completed";
    }

    let poseStep: StepStatus = "pending";
    if (uploadStep !== "completed") poseStep = "pending";
    else if (poseStatus === "processing") poseStep = "active";
    else if (poseStatus === "completed") poseStep = "completed";
    else if (poseStatus === "failed") poseStep = "failed";
    else if (poseStatus === "pending" || poseStatus === "unknown") {
      poseStep = "pending";
    }

    let chapterStep: StepStatus = "pending";
    if (uploadStep !== "completed") chapterStep = "pending";
    else if (taskStatus === "processing") chapterStep = "active";
    else if (taskStatus === "completed") chapterStep = "completed";
    else if (taskStatus === "failed") chapterStep = "failed";
    else if (taskStatus === "pending" || taskStatus === "unknown") {
      chapterStep = "pending";
    }

    return [
      {
        label:
          uploadFailed || isUploading || hasLocalPreview
            ? "Upload"
            : "Upload complete",
        status: uploadStep,
      },
      {
        label: formatStepLabel("Pose Estimation", poseStep),
        status: poseStep,
      },
      {
        label: formatStepLabel("Chapter Detection", chapterStep),
        status: chapterStep,
      },
    ];
  }, [
    hasUploadedVideo,
    hasLocalPreview,
    isUploading,
    poseStatus,
    statusResolved,
    taskStatus,
    uploadFailed,
    workerStarted,
  ]);

  const pipelineVisible =
    shouldTrackPipeline &&
    pipelineSteps.some(
      (step) => step.status === "pending" || step.status === "active",
    );

  return { pipelineSteps, pipelineVisible, frames };
}
