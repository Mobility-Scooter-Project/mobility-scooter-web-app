export function formatSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

export function normalizeSessionTime(sessionTime: string): string {
  const trimmed = sessionTime.trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return trimmed;
  }

  return `${match[1]}:${match[2]}`;
}

export function formatSessionTime(sessionTime?: string): string {
  if (!sessionTime) {
    return "";
  }

  const normalized = normalizeSessionTime(sessionTime);
  const match = normalized.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return normalized;
  }

  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${suffix}`;
}

export function parseDisplaySessionDateTime(
  date: string,
  sessionTime?: string,
): number {
  const [month = "", day = "", year = ""] = date.split("/");
  const monthNumber = Number.parseInt(month, 10);
  const dayNumber = Number.parseInt(day, 10);
  const yearNumber = Number.parseInt(year, 10);
  const normalizedTime = normalizeSessionTime(sessionTime ?? "00:00");
  const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2})$/);

  if (
    !Number.isFinite(monthNumber) ||
    !Number.isFinite(dayNumber) ||
    !Number.isFinite(yearNumber) ||
    !timeMatch
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  return Date.UTC(
    yearNumber,
    monthNumber - 1,
    dayNumber,
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
}
