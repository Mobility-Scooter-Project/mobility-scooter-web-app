import { useState } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { ChapterCard } from "./ChapterCard";
import Placeholder from "~/assets/placeholder-thumbnail.png";

type Chapter = {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: string;
  author: string;
  lastUpdated: string;
  score: number | null;
  description: string;
};

const initialChapters: Chapter[] = [
  {
    id: 1,
    thumbnailUrl: Placeholder,
    title: "Spinning that Whip",
    timestamp: "00:00",
    author: "Garrett Lo",
    lastUpdated: "Last Updated Sep 25",
    score: 4,
    description:
      "This part of the track has a really strong baseline. Could be mixed higher.",
  },
  {
    id: 2,
    thumbnailUrl: Placeholder,
    title: "The Breakdown",
    timestamp: "01:30",
    author: "Garrett Lo",
    lastUpdated: "Last Updated Sep 26",
    score: null,
    description: "",
  },
];

export function ChapterContent() {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => setSelectedId(id);
  const handleDeselect = () => setSelectedId(null);

  const handleScoreChange = (chapterId: number, newScore: number) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, score: ch.score === newScore ? null : newScore }
          : ch
      )
    );
  };

  const handleTitleChange = (chapterId: number, next: string) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, title: next } : ch))
    );
  };

  const handleDescriptionChange = (chapterId: number, next: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, description: next } : ch
      )
    );
  };

  const handleNewChapter = () => {
    const nextId = chapters.length
      ? Math.max(...chapters.map((c) => c.id)) + 1
      : 1;

    const dateStr = `${new Date()
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .replace(",", "")}`;

    const newItem: Chapter = {
      id: nextId,
      thumbnailUrl: Placeholder,
      title: "",
      timestamp: "00:00",
      author: "Garrett Lo",
      lastUpdated: `Last Updated ${dateStr}`,
      score: null,
      description: "",
    };

    setChapters([newItem, ...chapters]);
    setSelectedId(nextId);
  };

  const effectiveSelectedId = selectedId ?? null;

  return (
    <div>
      <Button
        variant="ghost"
        className="text-muted-foreground w-auto px-4 mb-3"
        onClick={handleNewChapter}
      >
        <Icon name="ListPlus" />
        <span>New Chapter</span>
      </Button>

      <section className="flex flex-col gap-3">
        {chapters.map(
          (
            chapter // TODO: holy bloat, refactor in the future
          ) => (
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
          )
        )}
      </section>
    </div>
  );
}
