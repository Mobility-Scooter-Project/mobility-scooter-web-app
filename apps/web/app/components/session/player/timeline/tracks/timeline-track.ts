import * as React from "react";

export type TrackInteraction = "move" | "resize-start" | "resize-end";

export interface TimeRange {
  startTime: number;
  endTime: number;
}

/** Minimum allowed duration (in seconds) for a track segment after resizing. */
export const MIN_TRACK_DURATION = 0.5;

/** Minimum rendered width (in pixels) for a track segment, preventing it from becoming unclickable. */
export const MIN_VISIBLE_WIDTH_PX = 30;
export const TRACK_LABEL_HEIGHT_PX = 26;
export const TRACK_ROW_GAP_PX = 6;

export interface TrackRowLayout<T extends TimeRange> {
  item: T;
  row: number;
  style: React.CSSProperties;
}

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

function getTrackPixelBounds(
  range: TimeRange,
  totalDuration: number,
  containerWidth: number,
) {
  const safeDuration = getSafeDuration(totalDuration);
  const startPercent = clamp(range.startTime / safeDuration, 0, 1);
  const endPercent = clamp(range.endTime / safeDuration, 0, 1);
  const leftPx = startPercent * containerWidth;
  const rawWidthPx = Math.max((endPercent - startPercent) * containerWidth, 0);
  const widthPx = clamp(
    Math.max(rawWidthPx, MIN_VISIBLE_WIDTH_PX),
    0,
    Math.max(0, containerWidth - leftPx),
  );

  return {
    leftPx,
    widthPx,
    rightPx: leftPx + widthPx,
  };
}

export function getTrackPixelStyle(
  range: TimeRange,
  totalDuration: number,
  containerWidth: number,
): React.CSSProperties {
  const { leftPx, widthPx } = getTrackPixelBounds(
    range,
    totalDuration,
    containerWidth,
  );

  return {
    left: `${leftPx}px`,
    width: `${widthPx}px`,
  };
}

export function layoutTrackRows<T extends TimeRange & { id: string }>(
  items: T[],
  totalDuration: number,
  containerWidth: number,
): { items: TrackRowLayout<T>[]; rowCount: number } {
  if (items.length === 0) {
    return { items: [], rowCount: 1 };
  }

  if (containerWidth <= 0) {
    return {
      items: items.map((item) => ({
        item,
        row: 0,
        style: {
          ...getTrackPosition(item, totalDuration),
          top: "0px",
        },
      })),
      rowCount: 1,
    };
  }

  const placements = new Map<string, TrackRowLayout<T>>();
  const rowEnds: number[] = [];

  const sortedItems = items
    .map((item, index) => ({
      item,
      index,
      ...getTrackPixelBounds(item, totalDuration, containerWidth),
    }))
    .sort((a, b) => {
      if (a.leftPx !== b.leftPx) return a.leftPx - b.leftPx;
      if (a.rightPx !== b.rightPx) return a.rightPx - b.rightPx;
      return a.index - b.index;
    });

  for (const entry of sortedItems) {
    let row = rowEnds.findIndex((endPx) => entry.leftPx >= endPx);
    if (row === -1) {
      row = rowEnds.length;
    }

    rowEnds[row] = entry.rightPx + TRACK_ROW_GAP_PX;
    placements.set(entry.item.id, {
      item: entry.item,
      row,
      style: {
        ...getTrackPixelStyle(entry.item, totalDuration, containerWidth),
        top: `${row * (TRACK_LABEL_HEIGHT_PX + TRACK_ROW_GAP_PX)}px`,
      },
    });
  }

  return {
    items: items.map(
      (item) =>
        placements.get(item.id) ?? {
          item,
          row: 0,
          style: {
            ...getTrackPosition(item, totalDuration),
            top: "0px",
          },
        },
    ),
    rowCount: Math.max(1, rowEnds.length),
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
