import { useMemo, useRef } from "react";
import { useChapterStore } from "~/stores/useChapterStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { cn } from "~/lib/utils";
import { useTimelineSeek } from "~/hooks/useTimelineSeek";
import { calculateTimelineSegments } from "~/lib/timeline-calculations";

/**
 * Renders the primary seekbar/timeline split into segments based on chapters.
 * Handles user scrubbing interactions.
 */
export function ChapterTrack() {
  const chapters = useChapterStore((state) => state.chapters);
  const { duration, currentTime } = useVideoStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const safeDuration = duration > 0 ? duration : 1;

  const segments = useMemo(
    () => calculateTimelineSegments(chapters, safeDuration), 
    [chapters, safeDuration]
  );

  const { isDragging, startSeek } = useTimelineSeek(containerRef, safeDuration);

  return (
    <div
      ref={containerRef}
      className="relative h-4 w-full mt-2 cursor-pointer group touch-none select-none flex items-center"
      onMouseDown={startSeek}
    >
      {/* Track Layer */}
      <div className="absolute inset-0 w-full h-full flex items-center overflow-hidden rounded-full">
        {segments.map((seg, index) => {
          const startPct = (seg.start / safeDuration) * 100;
          const widthPct = ((seg.end - seg.start) / safeDuration) * 100;
          
          // Progress within this specific segment (clamped 0-1)
          const segProgress = Math.max(0, Math.min(1, (currentTime - seg.start) / (seg.end - seg.start)));
          const fillPercent = Number.isNaN(segProgress) ? 0 : segProgress * 100;

          // Visual Gap: Apply 4px gap to all except the last segment
          const isLast = index === segments.length - 1;
          const widthStyle = isLast ? `${widthPct}%` : `calc(${widthPct}% - 4px)`;

          return (
            <div
              key={seg.id}
              className="absolute h-1 bg-foreground/20 rounded-full overflow-hidden"
              style={{ left: `${startPct}%`, width: widthStyle }}
              title={seg.title}
            >
              {/* Progress Fill */}
              <div 
                className="h-full bg-foreground transition-none"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Scrubber Bulb */}
      <div
        className={cn(
          "absolute top-1/2 size-2 bg-foreground rounded-full z-50 shadow-sm",
          "-translate-x-1/2 -translate-y-1/2 pointer-events-none transition-none", 
        )}
        style={{ left: `${(currentTime / safeDuration) * 100}%` }}
      />
    </div>
  );
}