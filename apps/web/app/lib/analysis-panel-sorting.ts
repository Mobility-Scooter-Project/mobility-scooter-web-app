import type { Annotation, Chapter } from "~/data/mock-session-data";

export function sortChaptersByStartTime(items: readonly Chapter[]): Chapter[] {
  return [...items].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.id.localeCompare(b.id);
  });
}

export function sortAnnotationsByStartTime(
  items: readonly Annotation[],
): Annotation[] {
  return [...items].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    if (a.endTime !== b.endTime) return a.endTime - b.endTime;
    return a.id.localeCompare(b.id);
  });
}
