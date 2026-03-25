import { useVideoStore } from "~/stores/useVideoStore";
import { clamp, getSafeDuration } from "./tracks/timeline-track";

export function TimelinePlayhead() {
  const duration = useVideoStore((state) => state.duration);
  const currentTime = useVideoStore((state) => state.currentTime);

  const safeDuration = getSafeDuration(duration);
  const progressPercent = clamp((currentTime / safeDuration) * 100, 0, 100);

  return (
    <div
      className="absolute top-0 -bottom-px z-20 w-px bg-foreground/50 pointer-events-none"
      style={{
        left: `${progressPercent}%`,
        transform: "translateX(-50%)",
      }}
    />
  );
}