import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Media Utilities

/**
 * Formats a number of bytes into a human-readable string (MB or GB).
 *
 * @param n - The number of bytes to format.
 * @returns A string representing the size with one decimal place (e.g., "1.5 MB").
 */
export function formatBytes(n: number): string {
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  return n >= GB ? `${(n / GB).toFixed(1)} GB` : `${(n / MB).toFixed(1)} MB`;
}

/**
 * Formats a duration in seconds into a timestamp string (HH:MM:SS or MM:SS).
 *
 * @param sec - The duration in seconds.
 * @returns A formatted string or "—" if the input is invalid or infinite.
 */
export function formatDuration(sec?: number): string {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.round(sec),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    r = s % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
