import { useRef } from "react";
import { TimelineTicks } from "./TimelineTicks";
import { useVideoStore } from "~/stores/useVideoStore";

interface TimelineProps {
  children: React.ReactNode;
}

export function Timeline({ children }: TimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const duration = useVideoStore((state) => state.duration);
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);

  const handleSeek = (clientX: number) => {
    if (!ref.current || duration <= 0) return;
    const rect = ref.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentTime(percent * duration);
  };

  return (
    <div
      ref={ref}
      className="relative w-full cursor-pointer group pt-1 pb-2"
      onMouseDown={(e) => {
        // Only seek if left click and NOT on an interactive child (preventConflict)
        if (e.button === 0 && !(e.target as HTMLElement).closest(".prevent-seek")) {
           handleSeek(e.clientX);
        }
      }}
      onMouseMove={(e) => {
        if (e.buttons === 1 && !(e.target as HTMLElement).closest(".prevent-seek")) {
            handleSeek(e.clientX);
        }
      }}
    >
      <div className="relative h-3 w-full opacity-60 mb-4 pointer-events-none">
        <TimelineTicks duration={duration > 0 ? duration : 1} />
      </div>
      {children}
    </div>
  );
}