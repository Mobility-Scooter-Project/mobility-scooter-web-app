import { cn } from "~/lib/utils";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { useEffect, useRef } from "react";

interface ChapterCardProps {
  thumbnailUrl: string;
  title: string;
  timestamp: string;
  author: string;
  lastUpdated: string;
  score?: number | null;
  description: string; // empty string means no description
  selected: boolean;

  onSelect: () => void;
  onDeselect: () => void;
  onTitleChange: (next: string) => void;
  onDescriptionChange: (next: string) => void;
  onScoreChange: (newScore: number) => void;
}

export function ChapterCard({
  thumbnailUrl,
  title,
  timestamp,
  author,
  lastUpdated,
  score,
  description,
  selected,
  onSelect,
  onDeselect,
  onTitleChange,
  onDescriptionChange,
  onScoreChange,
}: ChapterCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onDocClick = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) onDeselect();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [selected, onDeselect]);

  const showTextarea = selected || description.trim().length > 0;

  return (
    <Card
      ref={rootRef}
      className={cn(
        "relative bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
        "transition-all duration-200 border border-primary/50",
        selected ? "opacity-100" : "border-transparent"
      )}
      onClick={() => {
        if (!selected) onSelect();
      }}
    >
      {/* settings button */}
      <Button
        variant="ghost"
        className="absolute top-3 right-3 text-muted-foreground hover:bg-accent/30"
      >
        <Icon name="EllipsisVertical" />
      </Button>

      {/* thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title || "Chapter thumbnail"}
        className="rounded-sm object-cover aspect-video max-w-60"
      />

      {/* title */}
      <TextArea
        autoFocus
        rows={1}
        placeholder="Write title here..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-headline font-semibold text-foreground mt-4 p-0 border-0 rounded-none focus-within:shadow-none bg-transparent resize-none leading-tight placeholder:text-foreground/70 placeholder:font-normal"
      />

      {/* timestamp / meta */}
      <section className="flex items-center gap-2 text-label text-muted-foreground">
        <button className="bg-card rounded-full px-3 py-1">{timestamp}</button>
        <span>•</span>
        <span>{author}</span>
        <span>•</span>
        <span>{lastUpdated}</span>
      </section>

      {/* score */}
      <div className="flex flex-col gap-1.5 mt-4">
        <span className="text-label text-muted-foreground">Score</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              size="inline"
              variant="outline"
              className={cn(score === num && "bg-accent hover:bg-accent")}
              onClick={() => onScoreChange(num)}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* description */}
      {showTextarea ? (
        selected ? (
          <TextArea
            placeholder="Write here..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="border-0 rounded-none focus-within:shadow-none p-0 placeholder:text-foreground/70 mt-2"
          />
        ) : (
          <p className="leading-6 text-foreground whitespace-pre-wrap mt-2">
            {description}
          </p>
        )
      ) : null}
    </Card>
  );
}
