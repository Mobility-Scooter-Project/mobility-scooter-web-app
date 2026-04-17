import type { WorkerStatusInfo, WorkerStepInfo } from "~/services/video-worker";

export type WorkerLifecycleStatus =
  | "unknown"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export function normalizeWorkerStatus(
  raw: string | null | undefined,
): WorkerLifecycleStatus {
  switch (raw) {
    case "completed":
    case "processed":
      return "completed";
    case "partially_processed":
      return "failed";
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

export function getWorkerStep(
  status: WorkerStatusInfo | null | undefined,
  step: string,
): WorkerStepInfo | undefined {
  return status?.steps.find((item) => item.step === step);
}

export function getWorkerStepStatus(
  status: WorkerStatusInfo | null | undefined,
  step: string,
): WorkerLifecycleStatus {
  const stepStatus = getWorkerStep(status, step);
  if (stepStatus) {
    return normalizeWorkerStatus(stepStatus.status);
  }

  if (!status) {
    return "unknown";
  }

  if (status.overallStatus === null) {
    return "pending";
  }

  return normalizeWorkerStatus(status.overallStatus);
}

export function isWorkerStarted(
  status: WorkerStatusInfo | null | undefined,
): boolean {
  return Boolean(status && (status.overallStatus !== null || status.steps.length));
}

export function isWorkerTerminal(
  status: WorkerStatusInfo | null | undefined,
): boolean {
  const overall = normalizeWorkerStatus(status?.overallStatus);
  return overall === "completed" || overall === "failed";
}

export function hasWorkerFailure(
  status: WorkerStatusInfo | null | undefined,
): boolean {
  if (normalizeWorkerStatus(status?.overallStatus) === "failed") {
    return true;
  }

  return status?.steps.some(
    (step) => normalizeWorkerStatus(step.status) === "failed",
  ) ?? false;
}
