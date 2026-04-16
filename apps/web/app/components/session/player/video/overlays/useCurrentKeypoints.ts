import { useMemo, useRef } from "react";
import { useVideoStore } from "~/stores/useVideoStore";
import type { Keypoints, VideoFrameData } from "~/types/overlay";

/**
 * Returns the keypoints for the most recent past frame based on the current video time.
 * This acts as a step-function, showing ground-truth data without interpolation.
 */
export function useCurrentKeypoints(frames?: VideoFrameData[]): Keypoints | null {
  const currentTime = useVideoStore((state) => state.currentTime);
  const lastIndexRef = useRef(0);

  return useMemo(() => {
    if (!frames || frames.length === 0) {
      lastIndexRef.current = 0;
      return null;
    }

    const maxIndex = frames.length - 1;
    let index = Math.min(lastIndexRef.current, maxIndex);

    if (
      index < maxIndex &&
      currentTime >= frames[index].timestamp &&
      currentTime < frames[index + 1].timestamp
    ) {
      return frames[index].keypoints;
    }

    if (currentTime < frames[0].timestamp) {
      lastIndexRef.current = 0;
      return frames[0].keypoints;
    }

    if (currentTime >= frames[maxIndex].timestamp) {
      lastIndexRef.current = maxIndex;
      return frames[maxIndex].keypoints;
    }

    let low = 0;
    let high = maxIndex;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      if (frames[mid].timestamp <= currentTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    index = Math.max(0, high);
    lastIndexRef.current = index;

    return frames[index].keypoints;
  }, [frames, currentTime]);
}