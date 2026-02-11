import { memo, useEffect, useRef, useState } from "react";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { cn } from "~/lib/utils";
import { useVideoStore } from "~/stores/useVideoStore";
import type { Annotation } from "~/data/mock-session-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/Dropdown";
import { useAutoDeselect } from "~/hooks/useAutoDeselect";
import { TimeInput } from "../common/TimeInput";
import { getDigitsFromSeconds, timeStringToSeconds, formatTimeDigits } from "~/lib/formatters";

interface AnnotationCardProps {
  id: number;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  author: string;
  date: string;
  description: string;
  selected: boolean;
  onSelect: (id: number) => void;
  onDeselect: () => void;
  onTitleChange: (id: number, next: string) => void;
  onDescriptionChange: (id: number, next: string) => void;
  onUpdate: (id: number, updates: Partial<Annotation>) => void;
  onDelete: (id: number) => void;
}

/**
 * A card representing a specific time range annotation.
 * Allows editing of title, description, start time, and end time.
 */
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
    onUpdate,
    onDelete,
  }: AnnotationCardProps) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const videoDuration = useVideoStore((state) => state.duration);

    const [startDigits, setStartDigits] = useState("");
    const [endDigits, setEndDigits] = useState("");

    // Sync state when props change (external updates or slider moves)
    useEffect(() => {
      setStartDigits(getDigitsFromSeconds(startTime));
      setEndDigits(getDigitsFromSeconds(endTime));
    }, [startTime, endTime]);

    // Hook: Handle clicking outside to deselect
    useAutoDeselect(rootRef, selected, onDeselect);

    const commitStart = () => {
      const seconds = timeStringToSeconds(formatTimeDigits(startDigits));
      const maxDuration = videoDuration > 0 ? videoDuration : Infinity;

      let newStart = Math.min(Math.max(0, seconds), maxDuration);
      if (newStart > endTime) newStart = endTime;

      setStartDigits(getDigitsFromSeconds(newStart));

      if (newStart !== startTime) {
        onUpdate(id, { startTime: newStart });
      }
    };

    const commitEnd = () => {
      const seconds = timeStringToSeconds(formatTimeDigits(endDigits));
      const maxDuration = videoDuration > 0 ? videoDuration : Infinity;

      let newEnd = Math.min(Math.max(0, seconds), maxDuration);
      if (newEnd < startTime) newEnd = startTime;

      setEndDigits(getDigitsFromSeconds(newEnd));

      if (newEnd !== endTime) {
        onUpdate(id, { endTime: newEnd });
      }
    };

    const showTextarea = selected || description.trim().length > 0;

    return (
      <Card
        ref={rootRef}
        className={cn(
          "bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
          "transition-all duration-200 border border-primary/50",
          selected ? "opacity-100" : "border-transparent",
        )}
        onClick={() => !selected && onSelect(id)}
      >
        <header className="flex items-center justify-between gap-2">
          <TextArea
            autoFocus
            rows={1}
            placeholder="Write title here..."
            value={title}
            onChange={(e) => onTitleChange(id, e.target.value)}
            className="text-headline font-semibold text-foreground p-0 border-0 rounded-none focus-within:shadow-none bg-transparent resize-none leading-tight placeholder:text-foreground/70 placeholder:font-normal"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-8"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Icon name="EllipsisVertical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
              >
                <Icon name="Trash2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex items-center gap-1 text-label text-muted-foreground my-1">
          <div className="flex items-center gap-0.5">
            <TimeInput
              value={startDigits}
              onChange={setStartDigits}
              onBlur={commitStart}
            />
            <span>-</span>
            <TimeInput
              value={endDigits}
              onChange={setEndDigits}
              onBlur={commitEnd}
            />
          </div>
          <span>•</span>
          <span>{author}</span>
          <span>•</span>
          <span>{date}</span>
        </div>

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
  },
);