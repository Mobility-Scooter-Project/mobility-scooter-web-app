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
}

export function useTrackInteraction<T extends TimeRange>({
  containerRef,
  totalDuration,
  getItemById,
  onUpdate,
  onSelect,
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

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;

        if (!hasDragged && Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
          return;
        }

        if (!hasDragged) {
          hasDragged = true;
          onSelect?.(id);
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
        if (!hasDragged) {
          onSelect?.(id);
        }

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [containerRef, getItemById, onSelect, onUpdate, totalDuration],
  );
}