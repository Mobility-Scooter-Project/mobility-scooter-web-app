import { useState } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { ChapterCard } from "./ChapterCard";
import Placeholder from "~/assets/placeholder-thumbnail.png";

type MockChapter = {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: string;
  author: string;
  lastUpdated: string;
  score: number | null;
  description: string;
};

const mockChapters: MockChapter[] = [
  {
    id: 1,
    thumbnailUrl: Placeholder,
    title: "Spinning that Whip",
    timestamp: "00:00",
    author: "Garrett Lo",
    lastUpdated: "Last Updated Sep 25", // may be a date instead ?
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
    score: null, // No score selected
    description: "", // Placeholder will show
  },
];

export function ChapterContent() {
  const [chapters, setChapters] = useState(mockChapters);

  const handleScoreChange = (chapterId: number, newScore: number) => { // TO BE CHANGED: once api is integrated, map by id not by this abomination
    setChapters((prevChapters) =>
      prevChapters.map((ch) =>
        ch.id === chapterId
          ? { ...ch, score: ch.score === newScore ? null : newScore }
          : ch
      )
    );
  };

  return (
    <div>
      <Button
        variant="ghost"
        className="text-muted-foreground w-auto px-4 mb-3"
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

            onScoreChange={(newScore) => handleScoreChange(chapter.id, newScore)}
            onShowMenuClick={() => console.log("Menu clicked:", chapter.id)}
            onTimestampClick={() => console.log("Timestamp clicked:", chapter.id)}
          />
        ))}
      </section>
    </div>
  );
}