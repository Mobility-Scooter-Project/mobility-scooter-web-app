import { useCallback, useEffect, useState, type PointerEvent, type RefObject } from "react";
import { useVideoStore } from "~/stores/useVideoStore";
import { clamp } from "~/components/session/player/timeline/tracks/timeline-track";

export function useTimelineSeek(
  containerRef: RefObject<HTMLElement | null>,
  duration: number,
) {
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);
  const seekTo = useVideoStore((state) => state.actions.seekTo);
  const [isDragging, setIsDragging] = useState(false);
  const safeDuration = duration > 0 ? duration : 1;

  const calculateTime = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return 0;

      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * safeDuration;
    },
    [containerRef, safeDuration],
  );

  const previewSeek = useCallback(
    (clientX: number) => {
      setCurrentTime(calculateTime(clientX));
    },
    [calculateTime, setCurrentTime],
  );

  const commitSeek = useCallback(
    (clientX: number) => {
      seekTo(calculateTime(clientX));
    },
    [calculateTime, seekTo],
  );

  useEffect(() => {
    if (!isDragging) return;

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  return {
    isDragging,
    handlePointerDown: (event: PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      previewSeek(event.clientX);
      setIsDragging(true);
    },
    handlePointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!isDragging) return;
      previewSeek(event.clientX);
    },
    handlePointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!isDragging) {
        commitSeek(event.clientX);
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setIsDragging(false);
      commitSeek(event.clientX);
    },
  };
}
