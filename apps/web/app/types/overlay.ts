export type StageOverlayKey = "gait" | "sway" | "points";

/**
 * Normalized [x, y] coordinates where 0.0 is top/left and 1.0 is bottom/right.
 */
export type Coordinate = [number, number];

/**
 * Dictionary mapping a specific joint/point name to its normalized coordinate.
 */
export type Keypoints = Record<string, Coordinate>;

/**
 * A single frame of analysis data.
 */
export interface VideoFrameData {
  timestamp: number;
  keypoints: Keypoints;
}