import type { VideoFrameData } from "~/types/overlay";
import { useCurrentFrameData } from "./useCurrentKeypoints";

const SWAY_COLOR = "#14b8a6";
const MARKER_HALO_COLOR = "rgba(15, 23, 42, 0.22)";
const ANGLE_BADGE_COLOR = "rgba(15, 23, 42, 0.68)";
const ANGLE_TEXT_COLOR = "#f8fafc";
const SHOULDER_KEY = "midpointShoulder";
const HIP_KEY = "midpointHip";

function formatAngle(angle: number) {
  const rounded = Math.round(angle * 10) / 10;
  const display =
    Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `Angle: ${display}\u00B0`;
}

interface SwayOverlayProps {
  frames?: VideoFrameData[];
}

export function SwayOverlay({ frames }: SwayOverlayProps) {
  const currentFrame = useCurrentFrameData(frames);

  const shoulder = currentFrame?.keypoints[SHOULDER_KEY];
  const hip = currentFrame?.keypoints[HIP_KEY];
  const angle = currentFrame?.angle;

  if (!shoulder || !hip) return null;

  const [shoulderX, shoulderY] = shoulder;
  const [hipX, hipY] = hip;
  const label = typeof angle === "number" ? formatAngle(angle) : "";
  const badgeWidth = Math.max(76, label.length * 7 + 18);
  const badgeHeight = 22;
  const labelAnchorX = Math.min(0.94, Math.max(0.06, (shoulderX + hipX) / 2));
  const labelY = Math.max(0.08, (shoulderY + hipY) / 2 - 0.02);
  const placeBadgeRight = labelAnchorX < 0.72;
  const badgeOffsetX = placeBadgeRight ? 10 : -(badgeWidth + 10);
  const badgeOffsetY = -11;
  const textOffsetX = badgeOffsetX + 9;

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <line
        x1={`${shoulderX * 100}%`}
        y1={`${shoulderY * 100}%`}
        x2={`${hipX * 100}%`}
        y2={`${hipY * 100}%`}
        stroke={SWAY_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        opacity="0.82"
      />

      <circle
        cx={`${shoulderX * 100}%`}
        cy={`${shoulderY * 100}%`}
        r="6"
        fill={MARKER_HALO_COLOR}
      />
      <circle
        cx={`${shoulderX * 100}%`}
        cy={`${shoulderY * 100}%`}
        r="4"
        fill={SWAY_COLOR}
        opacity="0.95"
      />

      <circle
        cx={`${hipX * 100}%`}
        cy={`${hipY * 100}%`}
        r="6"
        fill={MARKER_HALO_COLOR}
      />
      <circle
        cx={`${hipX * 100}%`}
        cy={`${hipY * 100}%`}
        r="4"
        fill={SWAY_COLOR}
        opacity="0.95"
      />

      {typeof angle === "number" && Number.isFinite(angle) ? (
        <>
          <rect
            x={`${labelAnchorX * 100}%`}
            y={`${labelY * 100}%`}
            width={badgeWidth}
            height={badgeHeight}
            rx="11"
            fill={ANGLE_BADGE_COLOR}
            transform={`translate(${badgeOffsetX} ${badgeOffsetY})`}
          />
          <text
            x={`${labelAnchorX * 100}%`}
            y={`${labelY * 100}%`}
            dx={textOffsetX}
            fill={ANGLE_TEXT_COLOR}
            fontSize="12"
            fontWeight="600"
            letterSpacing="0.1"
            opacity="0.96"
            dominantBaseline="middle"
          >
            {label}
          </text>
        </>
      ) : null}
    </svg>
  );
}
