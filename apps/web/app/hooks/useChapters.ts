import { useState } from "react";
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

const mockChapters: Chapter[] = [
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

/**
 * Mutation and state handlers for chapters.
 */
export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters); // todo: fetch from server. perhaps don't use useState here
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

  return {
    chapters,
    selectedId,
    handleSelect,
    handleDeselect,
    handleScoreChange,
    handleTitleChange,
    handleDescriptionChange,
    handleNewChapter,
  };
}
