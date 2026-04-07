import { useMemo } from "react";
import { useVideoStore } from "~/stores/useVideoStore";
import type { Keypoints, VideoFrameData } from "~/types/overlay";

/**
 * Returns the keypoints for the most recent past frame based on the current video time.
 * This acts as a step-function, showing ground-truth data without interpolation.
 */
export function useCurrentKeypoints(frames?: VideoFrameData[]): Keypoints | null {
  const currentTime = useVideoStore((s) => s.currentTime);

  return useMemo(() => {
    if (!frames || frames.length === 0) return null;

    for (let i = frames.length - 1; i >= 0; i--) {
      if (currentTime >= frames[i].timestamp) {
        return frames[i].keypoints;
      }
    }

    return frames[0].keypoints;
  }, [frames, currentTime]);
}