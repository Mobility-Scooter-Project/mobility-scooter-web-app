import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { memo, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { formatDuration } from "~/lib/formatters";

interface AnnotationCardProps {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  author: string;
  date: string;
  description: string; // empty string means no description
  selected: boolean;

  onSelect: (id: number) => void;
  onDeselect: () => void;
  onTitleChange: (id: number, next: string) => void;
  onDescriptionChange: (id: number, next: string) => void;
}

export const AnnotationCard = memo(
  ({
    id,
    title,
    startTime,
    endTime,
    author,
    date,
    description,
    selected,
    onSelect,
    onDeselect,
    onTitleChange,
    onDescriptionChange,
  }: AnnotationCardProps) => {
    const rootRef = useRef<HTMLDivElement | null>(null);

    // deselect on outside click
    useEffect(() => {
      if (!selected) return;
      const onDocClick = (e: MouseEvent) => {
        const el = rootRef.current;
        if (el && !el.contains(e.target as Node)) {
          onDeselect();
        }
      };
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }, [selected, onDeselect]);

    const showTextarea = selected || description.trim().length > 0;
    const timestamp = `${formatDuration(startTime)} - ${formatDuration(
      endTime
    )}`; // X:XX - Y:YY

    return (
      <Card
        ref={rootRef}
        className={cn(
          "bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
          "transition-all duration-200 border border-primary/50",
          selected ? "opacity-100" : "border-transparent"
        )}
        onClick={(e) => {
          if (!selected) onSelect(id);
        }}
      >
        <header className="flex items-center justify-between gap-2">
          {/* title */}
          <TextArea
            autoFocus
            rows={1}
            placeholder="Write title here..."
            value={title}
            onChange={(e) => onTitleChange(id, e.target.value)}
            className="text-headline font-semibold text-foreground p-0 border-0 rounded-none focus-within:shadow-none bg-transparent resize-none leading-tight placeholder:text-foreground/70 placeholder:font-normal"
          />

          <Button
            variant="ghost"
            className="size-8"
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
            <TextArea
              placeholder="Write here..."
              value={description}
              onChange={(e) => onDescriptionChange(id, e.target.value)}
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
);
