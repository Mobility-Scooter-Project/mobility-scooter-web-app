import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { ChapterCard } from "./ChapterCard";
import { useChapterStore } from "~/stores/useChapterStore";

/**
 * Render the list of chapters for the active session and view.
 */
export function ChapterContent() {
  const chapters = useChapterStore((state) => state.chapters);
  const selectedId = useChapterStore((state) => state.selectedId);
  const {
    handleSelect,
    handleDeselect,
    handleScoreChange,
    handleTitleChange,
    handleDescriptionChange,
    handleTimestampChange,
    handleNewChapter,
    handleDeleteChapter,
  } = useChapterStore((state) => state.actions);

  const effectiveSelectedId = selectedId ?? null;

  return (
    <div>
      <Button
        variant="ghost"
        className="text-foreground my-3"
        onClick={handleNewChapter}
      >
        <Icon name="ListPlus" />
        <span>New Chapter</span>
      </Button>

      <section className="flex flex-col gap-3">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            id={chapter.id}
            thumbnailUrl={chapter.thumbnailUrl}
            title={chapter.title}
            timestamp={chapter.timestamp}
            author={chapter.author}
            lastUpdated={chapter.lastUpdated}
            score={chapter.score}
            description={chapter.description}
            selected={effectiveSelectedId === chapter.id}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onScoreChange={handleScoreChange}
            onTimestampChange={handleTimestampChange}
            onDelete={handleDeleteChapter}
          />
        ))}
      </section>
    </div>
  );
}