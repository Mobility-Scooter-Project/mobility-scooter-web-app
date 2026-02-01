import { useMemo } from "react";
import { useChapterStore } from "~/stores/useChapterStore";
import { useVideoStore } from "~/stores/useVideoStore";

export function ChapterTrack() {
  const chapters = useChapterStore((state) => state.chapters);
  const { duration, currentTime } = useVideoStore();
  const safeDuration = duration > 0 ? duration : 1;

  const segments = useMemo(() => {
    if (!chapters.length) return [{ id: -1, start: 0, end: safeDuration }];
    
    // Sort logic
    const sorted = [...chapters].sort((a, b) => {
        const [am, as] = a.timestamp.split(":").map(Number);
        const [bm, bs] = b.timestamp.split(":").map(Number);
        return (am * 60 + as) - (bm * 60 + bs);
    });

    return sorted.map((ch, i) => {
      const [m, s] = ch.timestamp.split(":").map(Number);
      const start = m * 60 + s;
      let end = safeDuration;
      if (i < sorted.length - 1) {
        const [nm, ns] = sorted[i + 1].timestamp.split(":").map(Number);
        end = nm * 60 + ns;
      }
      return { id: ch.id, start, end };
    });
  }, [chapters, safeDuration]);

  return (
    <div className="relative h-2 w-full mt-2 pointer-events-none">
      {/* Background Track */}
      <div className="absolute inset-0 flex items-center w-full gap-1">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="h-1.5 bg-foreground/20 rounded-full"
            style={{ width: `${((seg.end - seg.start) / safeDuration) * 100}%` }}
          />
        ))}
      </div>

      {/* Progress & Playhead */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-full flex items-center gap-1">
        {segments.map((seg) => {
          const segDuration = seg.end - seg.start;
          const isActive = currentTime >= seg.start && currentTime < seg.end;
          const isPast = currentTime >= seg.end;
          
          let fillPct = 0;
          if (isPast) fillPct = 100;
          else if (isActive) fillPct = ((currentTime - seg.start) / segDuration) * 100;
          
          // Clamp
          fillPct = Math.max(0, Math.min(100, fillPct));

          return (
            <div key={seg.id} className="relative h-full" style={{ width: `${(segDuration / safeDuration) * 100}%` }}>
              <div className="h-full bg-foreground/80 rounded-full overflow-hidden" style={{ width: `${fillPct}%` }} />
              {isActive && (
                <div
                  className="absolute top-1/2 size-2.5 bg-foreground rounded-full z-10 -translate-x-1/2 -translate-y-1/2 shadow-sm"
                  style={{ left: `${fillPct}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}