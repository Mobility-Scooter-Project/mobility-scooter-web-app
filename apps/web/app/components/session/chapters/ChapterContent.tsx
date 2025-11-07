import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { ChapterCard } from "./ChapterCard";
import { useChapters } from "~/hooks/useChapters";

export function ChapterContent() {
  const {
    chapters,
    selectedId,
    handleSelect,
    handleDeselect,
    handleScoreChange,
    handleTitleChange,
    handleDescriptionChange,
    handleNewChapter,
  } = useChapters();

  const effectiveSelectedId = selectedId ?? null;

  return (
    <div>
      <Button
        variant="inline"
        className="text-muted-foreground w-auto px-4 mb-3"
        onClick={handleNewChapter}
      >
        <Icon name="ListPlus" />
        <span>New Chapter</span>
      </Button>

      <section className="flex flex-col gap-3">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            thumbnailUrl={chapter.thumbnailUrl}
            title={chapter.title}
            timestamp={chapter.timestamp}
            author={chapter.author}
            lastUpdated={chapter.lastUpdated}
            score={chapter.score}
            description={chapter.description}
            selected={effectiveSelectedId === chapter.id}
            onSelect={() => handleSelect(chapter.id)}
            onDeselect={handleDeselect}
            onTitleChange={(next) => handleTitleChange(chapter.id, next)}
            onDescriptionChange={(next) =>
              handleDescriptionChange(chapter.id, next)
            }
            onScoreChange={(newScore) =>
              handleScoreChange(chapter.id, newScore)
            }
          />
        ))}
      </section>
    </div>
  );
}
