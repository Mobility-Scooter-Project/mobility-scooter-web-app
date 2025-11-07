import { cn } from "~/lib/utils";

interface TimelineTicksProps {
  duration: number; // in seconds
}

export function TimelineTicks({ duration }: TimelineTicksProps) {
  const numSmallTicks = Math.ceil(duration / 15);

  return (
    <div className="relative h-full w-full">
      {Array.from({ length: numSmallTicks }).map((_, i) => {
        // Every 4th tick is a minute (0, 4, 8...)
        const isBigTick = i % 4 === 0;
        const leftPercent = (i / numSmallTicks) * 100;

        return (
          <div
            key={i}
            className={cn(
              "absolute w-px bg-foreground/50",
              isBigTick ? "h-3" : "h-1.5"
            )}
            style={{ left: `${leftPercent}%` }}
          />
        );
      })}
      {/* Final tick at 100% */}
      <div
        className="absolute right-0 w-px bg-foreground/50 h-1.5"
        style={{
          height: numSmallTicks % 4 === 0 ? "0.75rem" : "0.375rem",
        }}
      />
    </div>
  );
}