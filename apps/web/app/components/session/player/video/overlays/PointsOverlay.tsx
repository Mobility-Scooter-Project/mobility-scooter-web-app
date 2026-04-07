import type { VideoFrameData } from "~/types/overlay";
import { useCurrentKeypoints } from "./useCurrentKeypoints";
import { useSelectionStore } from "~/stores/useSelectionStore";
import { usePointStore } from "~/stores/usePointsStore";
import { KEYPOINT_TO_NAME } from "./overlay-utils";

interface PointsOverlayProps {
  frames: VideoFrameData[];
}

export function PointsOverlay({ frames }: PointsOverlayProps) {
  const currentKeypoints = useCurrentKeypoints(frames);

  const selectedId = useSelectionStore((s) => s.selectedId);
  const selectedType = useSelectionStore((s) => s.selectedType);
  const setSelection = useSelectionStore((s) => s.actions.setSelection);
  const points = usePointStore((s) => s.points);

  if (!currentKeypoints) return null;

  return (
    <svg 
      className="absolute inset-0 h-full w-full pointer-events-none" 
      preserveAspectRatio="none"
    >
      {Object.entries(currentKeypoints).map(([key, pointCoords]) => {
        // Find matching point in the store to get its ID and visibility status
        const mappedName = KEYPOINT_TO_NAME[key];
        const storePoint = points.find((p) => p.name === mappedName);

        // Hide keypoints that aren't marked as visible
        if (storePoint && storePoint.status !== "visible") return null;

        const isSelectable = storePoint !== undefined;
        const isSelected = isSelectable && selectedType === "point" && selectedId === storePoint.id;

        return (
          <circle
            key={key}
            cx={`${pointCoords[0] * 100}%`}
            cy={`${pointCoords[1] * 100}%`}
            r={isSelected ? "6" : "4"} // selected : default
            fill={isSelected ? "#0ea5e9" : "#ef4444"} // blue : red
            stroke={isSelected ? "white" : "transparent"}
            strokeWidth={isSelected ? "2" : "0"}
            className={`
              pointer-events-auto
              ${isSelectable ? "cursor-pointer hover:stroke-white hover:stroke-2" : ""}
            `}
            onClick={() => {
              if (isSelectable) {
                setSelection("point", storePoint.id);
              }
            }}
          />
        );
      })}
    </svg>
  );
}