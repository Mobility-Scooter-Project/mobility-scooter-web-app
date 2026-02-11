import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { useVideoStore } from "~/stores/useVideoStore";
import type { Annotation } from "~/data/mock-session-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/Dropdown";

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
  onUpdate: (id: number, updates: Partial<Annotation>) => void;
  onDelete: (id: number) => void; // New prop
}

// ... helper functions (toSeconds, formatDigits, getDigitsFromSeconds) same as before ...
// Helper: Convert formatted time string (H:MM:SS or MM:SS) to seconds
function toSeconds(timeStr: string) {
  const parts = timeStr.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parts[0] * 3600;
    seconds += parts[1] * 60;
    seconds += parts[2];
  } else if (parts.length === 2) {
    seconds += parts[0] * 60;
    seconds += parts[1];
  }
  return seconds;
}

// Helper: Format raw digit string to time string
function formatDigits(digits: string) {
  const val = parseInt(digits || "0", 10);
  if (isNaN(val)) return "00:00";

  const sStr = digits.slice(-2).padStart(2, "0");
  const remainder = digits.slice(0, -2);
  const mStr = remainder.slice(-2).padStart(2, "0");
  const hStr = remainder.slice(0, -2);

  if (hStr.length > 0) {
    return `${parseInt(hStr, 10)}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

// Helper: Extract raw digits from seconds (for initializing state)
function getDigitsFromSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0)
    return `${h}${String(m).padStart(2, "0")}${String(s).padStart(2, "0")}`;
  return `${m}${String(s).padStart(2, "0")}`;
}

const TimeInput = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) => {
  const displayValue = formatDigits(value);
  const widthClass = displayValue.length > 5 ? "w-[7ch]" : "w-[5ch]";

  return (
    <input
      className={cn(
        "bg-transparent border-b border-muted-foreground/30 hover:border-foreground focus:border-foreground rounded-none px-0 py-0 text-center outline-none focus:ring-0 transition-all tabular-nums text-label text-muted-foreground focus:text-foreground",
        widthClass,
      )}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (raw.length <= 6) onChange(parseInt(raw || "0", 10).toString());
      }}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

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

    useEffect(() => {
      setStartDigits(getDigitsFromSeconds(startTime));
      setEndDigits(getDigitsFromSeconds(endTime));
    }, [startTime, endTime]);

    useEffect(() => {
      if (!selected) return;
      const onDocClick = (e: MouseEvent) => {
        const el = rootRef.current;
        const target = e.target as HTMLElement;

        // If clicking inside card or inside a dropdown portal, don't deselect
        if (el && el.contains(target)) return;
        if (target.closest("[data-radix-portal]")) return;

        onDeselect();
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [selected, onDeselect]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.currentTarget as HTMLElement).blur();
      }
    };

    const commitStart = () => {
      const seconds = toSeconds(formatDigits(startDigits));
      const maxDuration = videoDuration > 0 ? videoDuration : Infinity;

      let newStart = Math.min(Math.max(0, seconds), maxDuration);
      if (newStart > endTime) newStart = endTime;

      const digits = getDigitsFromSeconds(newStart);
      setStartDigits(digits);

      if (newStart !== startTime) {
        onUpdate(id, { startTime: newStart });
      }
    };

    const commitEnd = () => {
      const seconds = toSeconds(formatDigits(endDigits));
      const maxDuration = videoDuration > 0 ? videoDuration : Infinity;

      let newEnd = Math.min(Math.max(0, seconds), maxDuration);
      if (newEnd < startTime) newEnd = startTime;

      const digits = getDigitsFromSeconds(newEnd);
      setEndDigits(digits);

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
        onClick={(e) => {
          if (!selected) onSelect(id);
        }}
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
              onKeyDown={handleKeyDown}
            />
            <span>-</span>
            <TimeInput
              value={endDigits}
              onChange={setEndDigits}
              onBlur={commitEnd}
              onKeyDown={handleKeyDown}
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
