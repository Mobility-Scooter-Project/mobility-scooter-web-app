import { cn } from "~/lib/utils";

export type StepStatus = "pending" | "active" | "completed" | "failed";

interface Step {
  label: string;
  status: StepStatus;
}

interface PipelineProgressProps {
  steps: Step[];
  className?: string;
}

/**
 * A minimal text-based progress indicator that shows the current pipeline step.
 * Displays "Step X/N - label..." with a pulsing animation.
 */
export function PipelineProgress({
  steps,
  className,
}: PipelineProgressProps) {
  const activeIndex = steps.findIndex((step) => step.status === "active");
  const pendingIndex =
    activeIndex === -1
      ? steps.findIndex((step) => step.status === "pending")
      : -1;
  const failedIndex = steps.findIndex((step) => step.status === "failed");

  if (failedIndex !== -1) {
    const step = steps[failedIndex];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-foreground",
          className,
        )}
      >
        <span>
          Step {failedIndex + 1}/{steps.length} - {step.label} failed
        </span>
      </span>
    );
  }

  const visibleIndex = activeIndex !== -1 ? activeIndex : pendingIndex;
  if (visibleIndex === -1) return null;

  const step = steps[visibleIndex];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="animate-pulse">
        Step {visibleIndex + 1}/{steps.length} - {step.label}
      </span>
    </span>
  );
}
