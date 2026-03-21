import { timeStringToSeconds } from "~/lib/formatters";
import type { Chapter } from "~/data/mock-session-data";

export type TimelineSegment = {
  id: number | string;
  start: number;
  end: number;
  isGap?: boolean;
  title?: string;
};

/**
 * Calculates timeline segments for chapters, including gaps between them.
 * Ensures a continuous timeline by filling empty spaces with "gap" segments.
 * 
 * @param chapters - List of chapters
 * @param totalDuration - Total duration of the video
 * @returns Array of segments (chapters and gaps) sorted by time
 */
export function calculateTimelineSegments(
  chapters: Chapter[],
  totalDuration: number
): TimelineSegment[] {
  // If no chapters, return one big "gap" segment so the bar renders
  if (!chapters.length) {
    return [{ id: "base", start: 0, end: totalDuration, isGap: true, title: "Timeline" }];
  }

  const sorted = [...chapters].sort((a, b) => a.timestamp - b.timestamp);

  const result: TimelineSegment[] = [];
  let currentCursor = 0;

  sorted.forEach((ch) => {
    const start = ch.timestamp;

    // Fill gap before chapter
    if (start > currentCursor) {
      result.push({
        id: `gap-${currentCursor}`,
        start: currentCursor,
        end: start,
        isGap: true,
      });
    }

    // Determine chapter end (start of next chapter OR total duration)
    const nextCh = sorted.find((c) => c.timestamp > start);
    let end = nextCh ? nextCh.timestamp : totalDuration;
    end = Math.min(end, totalDuration);

    if (end >= start) {
      result.push({ id: ch.id, start, end, isGap: false, title: ch.title });
    }
    currentCursor = Math.max(currentCursor, end);
  });

  // Fill final gap
  if (currentCursor < totalDuration) {
    result.push({
      id: "gap-end",
      start: currentCursor,
      end: totalDuration,
      isGap: true,
    });
  }

  return result;
}

/**
 * Clamps a time input to ensure it falls within the video duration 
 * and does not cross its opposite boundary (start > end).
 * 
 * @param type - Whether validating "start" or "end" time
 * @param newValue - The new time value to validate (in seconds)
 * @param oppositeValue - The opposite boundary time (end for start, start for end)
 * @param videoDuration - Total duration of the video (in seconds)
 * 
 * @return A valid time value that respects the boundaries and video duration
 * 
 * @example
 *    // For a video of 300 seconds, if user tries to set start time to 310, it will be clamped to 300.
 *    validateTimeBoundary("start", 310, 290, 300) // returns 290 (cannot be after end)
 */
export function validateTimeBoundary(
  type: "start" | "end",
  newValue: number,
  oppositeValue: number,
  videoDuration: number
): number {
  const maxDuration = videoDuration > 0 ? videoDuration : Infinity;
  
  let validTime = Math.min(Math.max(0, newValue), maxDuration);
  
  if (type === "start" && validTime > oppositeValue) validTime = oppositeValue;
  if (type === "end" && validTime < oppositeValue) validTime = oppositeValue;

  return validTime;
}