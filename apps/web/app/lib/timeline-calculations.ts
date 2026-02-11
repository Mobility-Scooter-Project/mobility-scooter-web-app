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

  const sorted = [...chapters].sort((a, b) => 
    timeStringToSeconds(a.timestamp) - timeStringToSeconds(b.timestamp)
  );

  const result: TimelineSegment[] = [];
  let currentCursor = 0;

  sorted.forEach((ch) => {
    const start = timeStringToSeconds(ch.timestamp);

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
    const nextCh = sorted.find((c) => timeStringToSeconds(c.timestamp) > start);
    let end = nextCh ? timeStringToSeconds(nextCh.timestamp) : totalDuration;
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