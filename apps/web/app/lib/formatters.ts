/**
 * Generic Time & Duration Formatting Utilities.
 */

/* ---------------- Display Formatters ---------------- */

/**
 * Formats a duration in seconds into a MM:SS or HH:MM:SS string.
 * Used for playback displays and labels.
 * @param seconds The total number of seconds.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  
  const totalSeconds = Math.floor(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const sStr = String(s).padStart(2, "0");
  const mStr = String(m).padStart(2, "0");

  if (h > 0) {
    return `${String(h)}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

/* ---------------- Input/Editing Formatters ---------------- */

/**
 * Formats a raw digit string into a time string (e.g., "1234" -> "12:34").
 * Used for the TimeInput component.
 */
export function formatTimeDigits(digits: string): string {
  const val = parseInt(digits || "0", 10);
  if (isNaN(val)) return "00:00";

  const sStr = digits.slice(-2).padStart(2, "0");
  const remainder = digits.slice(0, -2);
  const mStr = remainder.slice(-2).padStart(2, "0");
  const hStr = remainder.slice(0, -2);

  if (hStr.length > 0) {
    return `${parseInt(hStr, 10)}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

/**
 * Extracts raw digits from a seconds number for initialization (e.g., 75s -> "115" -> 1m 15s).
 */
export function getDigitsFromSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0)
    return `${h}${String(m).padStart(2, "0")}${String(s).padStart(2, "0")}`;
  return `${m}${String(s).padStart(2, "0")}`;
}

/**
 * Parses a time string (e.g., "1:30" or "01:30") back to total seconds.
 */
export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parts[0] * 3600;
    seconds += parts[1] * 60;
    seconds += parts[2];
  } else if (parts.length === 2) {
    seconds += parts[0] * 60;
    seconds += parts[1];
  }
  return seconds;
}