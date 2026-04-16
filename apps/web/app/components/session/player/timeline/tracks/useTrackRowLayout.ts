import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  TRACK_LABEL_HEIGHT_PX,
  TRACK_ROW_GAP_PX,
  layoutTrackRows,
  type TimeRange,
} from "./timeline-track";

export function useTrackRowLayout<T extends TimeRange & { id: string }>(
  containerRef: RefObject<HTMLElement | null>,
  items: T[],
  totalDuration: number,
) {
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      setContainerWidth(element.getBoundingClientRect().width);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();

    return () => observer.disconnect();
  }, [containerRef]);

  return useMemo(() => {
    const layout = layoutTrackRows(items, totalDuration, containerWidth);
    const containerHeight =
      layout.rowCount * TRACK_LABEL_HEIGHT_PX +
      Math.max(0, layout.rowCount - 1) * TRACK_ROW_GAP_PX;

    return {
      ...layout,
      containerHeight,
      containerWidth,
    };
  }, [containerWidth, items, totalDuration]);
}
