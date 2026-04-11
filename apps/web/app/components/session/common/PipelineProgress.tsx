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
 * Displays "Step X/N — label..." with a pulsing dot animation.
 */
export function PipelineProgress({ steps, className }: PipelineProgressProps) {
  // Find the first non-completed step to display.
  const activeIndex = steps.findIndex(
    (s) => s.status === "active" || s.status === "pending",
  );
  const failedIndex = steps.findIndex((s) => s.status === "failed");

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
          Step {failedIndex + 1}/{steps.length} — {step.label} failed
        </span>
      </span>
    );
  }

  if (activeIndex === -1) return null;

  const step = steps[activeIndex];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="animate-pulse">
        Step {activeIndex + 1}/{steps.length} — {step.label}
      </span>
    </span>
  );
}
