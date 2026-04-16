import type { Session } from "~/data/mock-session-data";

function parseDisplayDate(date: string): number {
  const [month = "", day = "", year = ""] = date.split("/");
  const monthNumber = Number.parseInt(month, 10);
  const dayNumber = Number.parseInt(day, 10);
  const yearNumber = Number.parseInt(year, 10);

  if (
    !Number.isFinite(monthNumber) ||
    !Number.isFinite(dayNumber) ||
    !Number.isFinite(yearNumber)
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return Date.UTC(yearNumber, monthNumber - 1, dayNumber);
}

export function sortSessionsForDirectory(
  sessions: readonly Session[],
): Session[] {
  return [...sessions].sort((a, b) => {
    if (a.notification !== b.notification) {
      return a.notification ? -1 : 1;
    }

    const aDate = parseDisplayDate(a.date);
    const bDate = parseDisplayDate(b.date);
    if (aDate !== bDate) {
      return bDate - aDate;
    }

    return b.id.localeCompare(a.id);
  });
}
