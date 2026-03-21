import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChapterStore } from "~/stores/useChapterStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { calculateTimelineSegments } from "~/lib/timeline-calculations";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const TRACK_ACTIVE_CLASS = "bg-foreground";
const TRACK_INACTIVE_CLASS = "bg-accent";
const THUMB_CLASS = "bg-foreground";

const SEGMENT_GAP_PX = 3;

export function ChapterTrack() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const chapters = useChapterStore((state) => state.chapters);
  const currentTime = useVideoStore((state) => state.currentTime);
  const duration = useVideoStore((state) => state.duration);
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);

  const [isDragging, setIsDragging] = useState(false);

  const safeDuration = duration > 0 ? duration : 1;

  const segments = useMemo(
    () => calculateTimelineSegments(chapters, safeDuration),
    [chapters, safeDuration],
  );

  const progressPercent = clamp((currentTime / safeDuration) * 100, 0, 100);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;

      const relativeX = clamp(clientX - rect.left, 0, rect.width);
      const nextTime = (relativeX / rect.width) * safeDuration;

      setCurrentTime(nextTime);
    },
    [safeDuration, setCurrentTime],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      seekFromClientX(event.clientX);
    },
    [seekFromClientX],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      seekFromClientX(event.clientX);
    },
    [isDragging, seekFromClientX],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDragging(false);
      seekFromClientX(event.clientX);
    },
    [isDragging, seekFromClientX],
  );

  useEffect(() => {
    const stopDragging = () => setIsDragging(false);

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            setCurrentTime(clamp(currentTime - 5, 0, safeDuration));
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            setCurrentTime(clamp(currentTime + 5, 0, safeDuration));
          }

          if (event.key === "Home") {
            event.preventDefault();
            setCurrentTime(0);
          }

          if (event.key === "End") {
            event.preventDefault();
            setCurrentTime(safeDuration);
          }
        }}
        className="relative h-4 w-full cursor-pointer touch-none select-none"
      >
        {segments.map((segment, index) => {
          const startPercent = (segment.start / safeDuration) * 100;
          const widthPercent =
            ((segment.end - segment.start) / safeDuration) * 100;

          const isFirst = index === 0;
          const isLast = index === segments.length - 1;

          const playedRatio =
            currentTime <= segment.start
              ? 0
              : currentTime >= segment.end
                ? 1
                : (currentTime - segment.start) / (segment.end - segment.start);

          return (
            <div
              key={segment.id}
              className="absolute top-1/2 h-1 -translate-y-1/2"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
              title={segment.title}
            >
              <div
                className="relative h-full rounded-full"
                style={{
                  marginLeft: isFirst ? 0 : SEGMENT_GAP_PX / 2,
                  marginRight: isLast ? 0 : SEGMENT_GAP_PX / 2,
                }}
              >
                <div
                  className={`absolute inset-0 rounded-full ${TRACK_INACTIVE_CLASS}`}
                />

                {playedRatio > 0 ? (
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full ${TRACK_ACTIVE_CLASS}`}
                    style={{ width: `${playedRatio * 100}%` }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}

        <div
          className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${THUMB_CLASS}`}
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}