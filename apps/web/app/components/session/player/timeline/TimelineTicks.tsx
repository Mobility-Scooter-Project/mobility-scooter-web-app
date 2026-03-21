import { useMemo } from "react";
import { cn } from "~/lib/utils";

interface TimelineTicksProps {
  duration: number;
}

export function TimelineTicks({ duration }: TimelineTicksProps) {
  const ticks = useMemo(() => {
    if (!duration || duration <= 0) return [0];

    const items = [0];

    for (let time = 15; time < duration; time += 15) {
      items.push(time);
    }

    return items;
  }, [duration]);

  return (
    <div className="relative h-2 w-full">
      {ticks.map((time) => {
        const isFirst = time === 0;
        const isMajor = time % 60 === 0;

        return (
          <div
            key={time}
            className={cn(
              "absolute top-0 w-px bg-foreground/50",
              isMajor ? "h-2" : "h-1",
              !isFirst && "-translate-x-1/2",
            )}
            style={{ left: `${(time / duration) * 100}%` }}
          />
        );
      })}
    </div>
  );
}