import { useState } from "react";

type Annotation = {
  id: number;
  title: string;
  timestamp: string;
  author: string;
  date: string;
  description: string;
};

const mockAnnotations: Annotation[] = [
  {
    id: 1,
    title: "Annotation Title Herer",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description: "Hi",
  },
  {
    id: 2,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25, 2024",
    description: "",
  },
  {
    id: 3,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description: "Written text description.",
  },
  {
    id: 4,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description:
      "Written text description notes this one shows the overflow wrapping with multiple displayed lines.",
  },
  {
    id: 5,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description:
      "Written text description notes showing wrapping text with new line implementation.\nThis is what it looks like when they press enter for new line.",
  },
];

export function useAnnotations() {
  const [annotations, setAnnotations] = useState(mockAnnotations);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => setSelectedId(id);
  const handleDeselect = () => setSelectedId(null);

  const handleTitleChange = (id: number, next: string) => {
    setAnnotations((list) =>
      list.map((a) => (a.id === id ? { ...a, title: next } : a))
    );
  };

  const handleDescriptionChange = (id: number, next: string) => {
    setAnnotations((list) =>
      list.map((a) => (a.id === id ? { ...a, description: next } : a))
    );
  };

  const handleNewAnnotation = () => {
    const nextId = annotations.length
      ? Math.max(...annotations.map((a) => a.id)) + 1
      : 1;
    const newItem = {
      id: nextId,
      title: "",
      timestamp: "00:00 - 00:00",
      author: "Garrett Lo",
      date: `${new Date()
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .replace(",", "")}`,
      description: "",
    };
    setAnnotations([newItem, ...annotations]);
    setSelectedId(nextId);
  };

  return {
    annotations,
    selectedId,
    handleSelect,
    handleDeselect,
    handleTitleChange,
    handleDescriptionChange,
    handleNewAnnotation,
  };
}