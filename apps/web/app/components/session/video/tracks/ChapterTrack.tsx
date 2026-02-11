import { useMemo, useRef, useState, useEffect } from "react";
import { useChapterStore } from "~/stores/useChapterStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { cn } from "~/lib/utils";

type Segment = {
  id: number | string;
  start: number;
  end: number;
  isGap?: boolean;
};

export function ChapterTrack() {
  const chapters = useChapterStore((state) => state.chapters);
  const { duration, currentTime } = useVideoStore();
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const safeDuration = duration > 0 ? duration : 1;

  // Calculate segments using absolute time to prevent flex-gap desync
  const segments = useMemo(() => {
    // Base case: If no chapters, render a full continuous bar
    if (chapters.length === 0) {
      return [{ id: "base-track", start: 0, end: safeDuration, isGap: false }];
    }

    const getSec = (t: string) => {
      const p = t.split(":").map(Number);
      if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
      return p[0] * 60 + p[1];
    };

    const sorted = [...chapters].sort((a, b) => getSec(a.timestamp) - getSec(b.timestamp));
    const result: Segment[] = [];
    let currentCursor = 0;

    sorted.forEach((ch) => {
      const start = getSec(ch.timestamp);

      // Gap segment (actual time gap in data)
      if (start > currentCursor) {
        result.push({
          id: `gap-${currentCursor}`,
          start: currentCursor,
          end: start,
          isGap: true,
        });
      }

      // Determine end
      const nextCh = sorted.find((c) => getSec(c.timestamp) > start);
      let end = nextCh ? getSec(nextCh.timestamp) : safeDuration;
      end = Math.min(end, safeDuration);

      if (end >= start) {
        result.push({ id: ch.id, start, end });
      }

      currentCursor = Math.max(currentCursor, end);
    });

    // Final gap
    if (currentCursor < safeDuration) {
      result.push({
        id: `gap-end`,
        start: currentCursor,
        end: safeDuration,
        isGap: true,
      });
    }

    return result;
  }, [chapters, safeDuration]);

  // --- Seek Interaction ---
  const handleSeek = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentTime(ratio * safeDuration);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      handleSeek(e.clientX);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
  }, [isDragging, safeDuration]);

  if (duration === 0) {
    return (
      <div className="relative h-4 w-full mt-2 bg-foreground/10 rounded-full animate-pulse" />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-4 w-full mt-2 cursor-pointer group touch-none select-none flex items-center"
      onMouseDown={(e) => {
        handleSeek(e.clientX);
        setIsDragging(true);
      }}
    >
      {/* Absolute Layer for Tracks */}
      <div className="absolute inset-0 w-full h-full flex items-center">
        {segments.map((seg, index) => {
          // If it's a gap in data, we don't render a bar
          if (seg.isGap) return null;

          const startPct = (seg.start / safeDuration) * 100;
          const widthPct = ((seg.end - seg.start) / safeDuration) * 100;
          
          // Current progress within this specific segment
          const segmentProgress = Math.max(0, Math.min(1, (currentTime - seg.start) / (seg.end - seg.start)));
          const fillPercent = Number.isNaN(segmentProgress) ? 100 : segmentProgress * 100;

          // Apply a visual gap (4px) to all except the very last segment
          const isLast = index === segments.length - 1;
          const widthStyle = isLast 
            ? `${widthPct}%` 
            : `calc(${widthPct}% - 4px)`;

          return (
            <div
              key={seg.id}
              className="absolute h-1 overflow-hidden rounded-full bg-foreground/20"
              style={{
                left: `${startPct}%`,
                width: widthStyle,
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-foreground"
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
          "-translate-x-1/2 -translate-y-1/2", 
          isDragging && "cursor-grabbing"
        )}
        style={{ left: `${(currentTime / safeDuration) * 100}%` }}
      />
    </div>
  );
}