import * as React from "react";

export type TrackInteraction = "move" | "resize-start" | "resize-end";

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export const MIN_TRACK_DURATION = 0.5;
export const MIN_VISIBLE_WIDTH_PX = 30;

export function getSafeDuration(duration: number) {
  return duration > 0 ? duration : 1;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getTrackPosition(
  range: TimeRange,
  totalDuration: number,
): React.CSSProperties {
  const safeDuration = getSafeDuration(totalDuration);

  const startPercent = clamp((range.startTime / safeDuration) * 100, 0, 100);
  const endPercent = clamp((range.endTime / safeDuration) * 100, 0, 100);
  const rawWidthPercent = Math.max(0, endPercent - startPercent);

  return {
    left: `${startPercent}%`,
    width: `${rawWidthPercent}%`,
    minWidth: `${MIN_VISIBLE_WIDTH_PX}px`,
  };
}

export function getUpdatedRange(
  range: TimeRange,
  deltaSeconds: number,
  totalDuration: number,
  action: TrackInteraction,
): TimeRange {
  const safeDuration = getSafeDuration(totalDuration);
  const width = range.endTime - range.startTime;

  switch (action) {
    case "move": {
      const startTime = clamp(
        range.startTime + deltaSeconds,
        0,
        safeDuration - width,
      );

      return {
        startTime,
        endTime: startTime + width,
      };
    }

    case "resize-start":
      return {
        startTime: clamp(
          range.startTime + deltaSeconds,
          0,
          range.endTime - MIN_TRACK_DURATION,
        ),
        endTime: range.endTime,
      };

    case "resize-end":
      return {
        startTime: range.startTime,
        endTime: clamp(
          range.endTime + deltaSeconds,
          range.startTime + MIN_TRACK_DURATION,
          safeDuration,
        ),
      };
  }
}