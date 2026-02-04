import * as React from "react";

/**
 * Hook to calculate dynamic width based on a fixed container height and media ratio.
 *
 * @param natural - The natural width and height of the media.
 * @param defaultRatio - Fallback ratio if natural dimensions are missing (default 9/16).
 * @returns { wrapRef, widthPx } - A ref for the container and the calculated width.
 */
export function useAspectRatio(
  natural?: { w: number; h: number },
  defaultRatio = 9 / 16,
) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [wrapH, setWrapH] = React.useState<number>(0);

  React.useEffect(() => {
    if (!wrapRef.current) return;

    const measure = () => {
      if (wrapRef.current) {
        setWrapH(wrapRef.current.getBoundingClientRect().height);
      }
    };

    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current);
    measure();

    return () => ro.disconnect();
  }, []);

  // Use natural dimensions if available, otherwise fallback to the default ratio
  const ratio = natural ? natural.w / natural.h : defaultRatio;
  const widthPx = wrapH > 0 ? wrapH * ratio : undefined;

  return { wrapRef, widthPx };
}
