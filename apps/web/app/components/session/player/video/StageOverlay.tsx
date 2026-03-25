import { cn } from "~/lib/utils";

interface StageOverlayProps {
  label: string;
  className?: string;
}

export function StageOverlay({ label, className }: StageOverlayProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10",
        className,
      )}
      aria-label={label}
    />
  );
}