import { useRef } from "react";
import { TimelineTicks } from "./TimelineTicks";
import { useVideoStore } from "~/stores/useVideoStore";
import { useTimelineSeek } from "~/hooks/useTimelineSeek";

interface TimelineProps {
  children: React.ReactNode;
}

/**
 * Renders the video timeline with interactive seeking and tracks.
 * - Displays a global playhead line based on currentTime.
 * - Contains an interactive area for seeking (TimelineTicks).
 * - Renders child tracks (e.g., chapters, annotations) in a stacked layout.
 */
export function Timeline({ children }: TimelineProps) {
  const { duration, currentTime } = useVideoStore();
  const safeDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, (currentTime / safeDuration) * 100);

  // Reuse the seek hook created previously (or inline logic if you prefer)
  const tickRef = useRef<HTMLDivElement>(null);
  const { startSeek } = useTimelineSeek(tickRef, safeDuration);

  return (
    <div className="relative w-full select-none">
      {/* Global Playhead Line */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div 
          className="absolute top-0 bottom-0 w-px bg-foreground -translate-x-1/2 transition-none"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Ticks */}
      <div 
        ref={tickRef}
        className="relative h-2 w-full opacity-60 mb-4 z-10 cursor-pointer"
        onMouseDown={startSeek}
      >
        <TimelineTicks duration={safeDuration} />
      </div>
      
      {/* Tracks Stack */}
      <div className="relative w-full flex flex-col gap-1 z-10">
        {children}
      </div>
    </div>
  );
}