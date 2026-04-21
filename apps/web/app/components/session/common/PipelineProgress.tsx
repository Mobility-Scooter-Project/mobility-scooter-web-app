import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export type StepStatus = "pending" | "active" | "completed" | "failed";

interface Step {
  label: string;
  status: StepStatus;
}

interface PipelineProgressProps {
  steps: Step[];
  className?: string;
  playbackReady?: boolean;
  overlaysReady?: boolean;
}

function getStatusMessage(
  steps: Step[],
  playbackReady: boolean,
  overlaysReady: boolean,
) {
  const failedStep = steps.find((step) => step.status === "failed");
  if (failedStep) {
    return "Processing failed";
  }

  const chapterStep = steps[2];
  const chaptersReady = chapterStep?.status === "completed";

  if (!playbackReady) {
    return "Uploading";
  }

  if (overlaysReady && !chaptersReady) {
    return "Generating chapters";
  }

  if (!overlaysReady) {
    return "Analyzing";
  }

  return "Processing";
}

export function PipelineProgress({
  steps,
  className,
  playbackReady = false,
  overlaysReady = false,
}: PipelineProgressProps) {
  const failedIndex = steps.findIndex((step) => step.status === "failed");
  const label = getStatusMessage(steps, playbackReady, overlaysReady);

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-label text-foreground",
        className,
      )}
    >
      {failedIndex !== -1 ? (
        <AlertCircle className="size-3.5 shrink-0 text-destructive" />
      ) : (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      )}
      <span className={cn(failedIndex !== -1 && "text-destructive")}>{label}</span>
    </span>
  );
}
