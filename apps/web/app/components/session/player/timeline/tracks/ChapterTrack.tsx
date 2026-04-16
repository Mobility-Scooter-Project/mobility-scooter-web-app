import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChapterStore } from "~/stores/useChapterStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { calculateTimelineSegments } from "~/lib/timeline-calculations";
import { clamp } from "./timeline-track";

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
  const seekTo = useVideoStore((state) => state.actions.seekTo);

  const [isDragging, setIsDragging] = useState(false);

  const safeDuration = duration > 0 ? duration : 1;

  const segments = useMemo(
    () => calculateTimelineSegments(chapters, safeDuration),
    [chapters, safeDuration],
  );

  const progressPercent = clamp((currentTime / safeDuration) * 100, 0, 100);

  const calculateTimeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return 0;

      const relativeX = clamp(clientX - rect.left, 0, rect.width);
      return (relativeX / rect.width) * safeDuration;
    },
    [safeDuration],
  );

  const previewSeekFromClientX = useCallback(
    (clientX: number) => {
      setCurrentTime(calculateTimeFromClientX(clientX));
    },
    [calculateTimeFromClientX, setCurrentTime],
  );

  const commitSeekFromClientX = useCallback(
    (clientX: number) => {
      seekTo(calculateTimeFromClientX(clientX));
    },
    [calculateTimeFromClientX, seekTo],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      previewSeekFromClientX(event.clientX);
    },
    [previewSeekFromClientX],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      previewSeekFromClientX(event.clientX);
    },
    [isDragging, previewSeekFromClientX],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        commitSeekFromClientX(event.clientX);
        return;
      }

      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDragging(false);
      commitSeekFromClientX(event.clientX);
    },
    [commitSeekFromClientX, isDragging],
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
            seekTo(clamp(currentTime - 5, 0, safeDuration));
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            seekTo(clamp(currentTime + 5, 0, safeDuration));
          }

          if (event.key === "Home") {
            event.preventDefault();
            seekTo(0);
          }

          if (event.key === "End") {
            event.preventDefault();
            seekTo(safeDuration);
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
              key={`${segment.id}-${index}`}
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