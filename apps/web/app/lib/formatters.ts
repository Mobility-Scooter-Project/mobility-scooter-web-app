/**
 * Formats a duration in seconds into a MM:SS or HH:MM:SS string.
 * @param seconds The total number of seconds.
 */
export function formatDuration(seconds: number): string {
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