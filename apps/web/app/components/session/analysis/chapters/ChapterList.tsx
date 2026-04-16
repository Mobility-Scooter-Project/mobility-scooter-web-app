import { useMemo } from "react";
import { useChapterStore } from "~/stores/useChapterStore";
import { useSelectionStore } from "~/stores/useSelectionStore";
import { sortChaptersByStartTime } from "~/lib/analysis-panel-sorting";
import { ChapterCard } from "./ChapterCard";

/**
 * Renders list of chapters for the current session, allowing users to select, update, or delete chapters.
 */
export function ChapterList() {
  const chapters = useChapterStore((state) => state.chapters);
  const sortedChapters = useMemo(
    () => sortChaptersByStartTime(chapters),
    [chapters],
  );

  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedType = useSelectionStore((state) => state.selectedType);
  const { setSelection, clearSelection } = useSelectionStore((state) => state.actions);

  const {
    updateChapter,
    handleDeleteChapter,
  } = useChapterStore((state) => state.actions);

  return (
    <div className="flex flex-col gap-3">
      {sortedChapters.map((chapter) => (
        <ChapterCard
          key={chapter.id}
          data={chapter}
          isSelected={selectedType === "chapter" && selectedId === chapter.id}
          onSelect={() => setSelection("chapter", chapter.id)}
          onDeselect={clearSelection}
          onUpdate={(updates) => updateChapter(chapter.id, updates)}
          onDelete={() => handleDeleteChapter(chapter.id)}
        />
      ))}
    </div>
  );
}
