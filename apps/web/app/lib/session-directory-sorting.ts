import type { Session } from "~/data/mock-session-data";
import { parseDisplaySessionDateTime } from "~/lib/session-date-time";

export function sortSessionsForDirectory(
  sessions: readonly Session[],
): Session[] {
  return [...sessions].sort((a, b) => {
    if (a.notification !== b.notification) {
      return a.notification ? -1 : 1;
    }

    const aDateTime = parseDisplaySessionDateTime(a.date, a.time);
    const bDateTime = parseDisplaySessionDateTime(b.date, b.time);
    if (aDateTime !== bDateTime) {
      return bDateTime - aDateTime;
    }

    return b.id.localeCompare(a.id);
  });
}
