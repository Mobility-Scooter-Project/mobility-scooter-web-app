import { useCallback } from "react";
import {
  getSafeDuration,
  getUpdatedRange,
  type TimeRange,
  type TrackInteraction,
} from "./timeline-track";

const DRAG_THRESHOLD_PX = 4;

interface UseTrackInteractionParams<T extends TimeRange> {
  containerRef: React.RefObject<HTMLElement | null>;
  totalDuration: number;
  getItemById: (id: string) => T | undefined;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onSelect?: (id: string) => void;
  onInteractionStart?: (id: string, action: TrackInteraction) => void;
  onInteractionEnd?: () => void;
}

export function useTrackInteraction<T extends TimeRange>({
  containerRef,
  totalDuration,
  getItemById,
  onUpdate,
  onSelect,
  onInteractionStart,
  onInteractionEnd,
}: UseTrackInteractionParams<T>) {
  return useCallback(
    (event: React.MouseEvent, id: string, action: TrackInteraction) => {
      event.preventDefault();
      event.stopPropagation();

      const container = containerRef.current;
      const item = getItemById(id);

      if (!container || !item) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;

      const startX = event.clientX;
      const safeDuration = getSafeDuration(totalDuration);
      const initialRange = {
        startTime: item.startTime,
        endTime: item.endTime,
      };

      let hasDragged = false;
      onSelect?.(id);
      onInteractionStart?.(id, action);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;

        if (!hasDragged && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
          return;
        }

        if (!hasDragged) {
          hasDragged = true;
        }

        const deltaSeconds = (deltaX / rect.width) * safeDuration;

        const nextRange = getUpdatedRange(
          initialRange,
          deltaSeconds,
          safeDuration,
          action,
        );

        onUpdate(id, nextRange as Partial<T>);
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        onInteractionEnd?.();
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [
      containerRef,
      getItemById,
      onInteractionEnd,
      onInteractionStart,
      onSelect,
      onUpdate,
      totalDuration,
    ],
  );
}
