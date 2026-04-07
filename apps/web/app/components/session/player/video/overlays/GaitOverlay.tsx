import type { VideoFrameData } from "~/types/overlay";
import { useCurrentKeypoints } from "./shared/useCurrentKeypoints";
import { KEYPOINT_TO_NAME } from "./shared/overlay-utils";
import { usePointStore } from "~/stores/usePointsStore";

const SKELETON_CONNECTIONS: [string, string][] = [
  // Head/Neck
  ["nose", "midpointShoulder"],
  ["midpointShoulder", "leftShoulder"],
  ["midpointShoulder", "rightShoulder"],
  
  // Torso Box
  ["leftShoulder", "rightShoulder"],
  ["leftHip", "rightHip"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],

  // Arms
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
];

interface GaitOverlayProps {
  frames: VideoFrameData[];
}

export function GaitOverlay({ frames }: GaitOverlayProps) {
  const currentKeypoints = useCurrentKeypoints(frames);
  const points = usePointStore((s) => s.points);

  if (!currentKeypoints) return null;

  const disabledKeypoints = new Set(
    Object.entries(KEYPOINT_TO_NAME)
      .filter(([key, displayName]) => {
        const point = points.find((p) => p.name === displayName);
        return point && point.status !== "visible";
      })
      .map(([key]) => key)
  );

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      preserveAspectRatio="none"
    >
      {SKELETON_CONNECTIONS.map(([startKey, endKey]) => {
        const start = currentKeypoints[startKey];
        const end = currentKeypoints[endKey];

        if (!start || !end) return null;
        if (disabledKeypoints.has(startKey) || disabledKeypoints.has(endKey)) return null;

        return (
          <line
            key={`${startKey}-${endKey}`}
            x1={`${start[0] * 100}%`}
            y1={`${start[1] * 100}%`}
            x2={`${end[0] * 100}%`}
            y2={`${end[1] * 100}%`}
            stroke="#06b6d4"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })}
    </svg>
  );
}