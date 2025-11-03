import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { AnnotationCard } from "./AnnotationCard";

const mockAnnotations = [
  {
    id: 1,
    title: "Annotation Title Herer",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
  },
  {
    id: 2,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25, 2024",
    description: undefined,
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
  {
    id: 6,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description:
      "Written text description notes showing wrapping text with new line implementation.\nThis is what it looks like when they press enter for new line.",
  },
  {
    id: 7,
    title: "Annotation Title Here",
    timestamp: "00:00 - 01:01",
    author: "Garrett Lo",
    date: "Sep 25",
    description:
      "Written text description notes showing wrapping text with new line implementation.\nThis is what it looks like when they press enter for new line.",
  },
];

export function AnalysisContent() {
  return (
    <div>
      <Button
        variant="ghost"
        className="text-foreground w-auto px-4 mt-2 mb-5"
      >
        <Icon name="Plus" />
        <span>New Annotation</span>
      </Button>

        <section className="flex flex-col gap-2">
          {mockAnnotations.map((annotation) => (
            <AnnotationCard
              key={annotation.id}
              title={annotation.title}
              timestamp={annotation.timestamp}
              author={annotation.author}
              date={annotation.date}
              description={annotation.description}
            />
          ))}
        </section>
    </div>
  );
}
