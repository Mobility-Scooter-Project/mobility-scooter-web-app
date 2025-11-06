import { Card } from "~/components/ui/card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { Textarea } from "~/components/ui/textarea";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

interface AnnotationCardProps {
  title: string;
  timestamp: string;
  author: string;
  date: string;
  description: string; // empty string means no description
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onTitleChange: (next: string) => void;
  onDescriptionChange: (next: string) => void;
}

export function AnnotationCard({
  title,
  timestamp,
  author,
  date,
  description,
  selected,
  onSelect,
  onDeselect,
  onTitleChange,
  onDescriptionChange,
}: AnnotationCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // deselect on outside click
  useEffect(() => {
    if (!selected) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        onDeselect();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [selected, onDeselect]);

  const showTextarea = selected || description.trim().length > 0;

  return (
    <Card
      ref={rootRef}
      className={cn("bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
        "transition-all duration-200 border border-primary/50",
        selected ? "opacity-100" : "border-transparent"
      )}
      onMouseDown={(e) => {
        if (!selected) onSelect();
      }}
    >
      <header className="flex items-center justify-between gap-2">
        {/* title */}
        <Textarea
          autoFocus
          rows={1}
          placeholder="Write title here..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-headline font-semibold text-foreground p-0 border-0 rounded-none focus-within:shadow-none bg-transparent resize-none leading-tight placeholder:text-foreground/70 placeholder:font-normal"
        />

        <Button
          variant="ghost"
          size="inline"
          className="text-muted-foreground hover:bg-accent/30"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Icon name="EllipsisVertical" />
        </Button>
      </header>

      {/* metadata */}
      <p className="text-label text-muted-foreground">
        {timestamp} • {author} • {date}
      </p>

      {/* description */}
      {showTextarea ? (
        selected ? (
          <Textarea
            placeholder="Write here..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="border-0 rounded-none focus-within:shadow-none p-0 placeholder:text-foreground/70"
          />
        ) : (
          <p className="leading-6 text-foreground whitespace-pre-wrap">
            {description}
          </p>
        )
      ) : null}
    </Card>
  );
}
