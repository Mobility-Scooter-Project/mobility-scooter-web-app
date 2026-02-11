import { cn } from "~/lib/utils";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { useEffect, useRef, useState } from "react";
import { useVideoStore } from "~/stores/useVideoStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/Dropdown";

interface ChapterCardProps {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: string;
  author: string;
  lastUpdated: string;
  score?: number | null;
  description: string;
  selected: boolean;

  onSelect: (id: number) => void;
  onDeselect: () => void;
  onTitleChange: (id: number, next: string) => void;
  onDescriptionChange: (id: number, next: string) => void;
  onScoreChange: (id: number, newScore: number) => void;
  onTimestampChange: (id: number, next: string) => void;
  onDelete: (id: number) => void; // New prop
}

// ... helper functions (toSeconds, fromSeconds, formatDigits) same as before ...
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

// Helper: Convert seconds to H:MM:SS or MM:SS
function fromSeconds(totalSeconds: number, forceHours = false) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0 || forceHours) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

export function ChapterCard({
  id,
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
  onTimestampChange,
  onDelete,
}: ChapterCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoDuration = useVideoStore((state) => state.duration);
  const [digits, setDigits] = useState("");

  useEffect(() => {
    const raw = timestamp.replace(/\D/g, "");
    setDigits(parseInt(raw, 10).toString());
  }, [timestamp]);

  useEffect(() => {
    if (!selected) return;
    const onDocClick = (e: MouseEvent) => {
      // Allow dropdown clicks to propagate, don't deselect immediately
      const el = rootRef.current;
      const target = e.target as HTMLElement;

      // If clicking inside card or inside a dropdown portal, don't deselect
      if (el && el.contains(target)) return;
      if (target.closest("[data-radix-portal]")) return;

      onDeselect();
    };
    document.addEventListener("mousedown", onDocClick); // Use mousedown for better handling with dropdowns
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selected, onDeselect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const raw = newVal.replace(/\D/g, "");
    if (raw.length > 6) return;
    setDigits(parseInt(raw || "0", 10).toString());
  };

  const commitChange = () => {
    const formatted = formatDigits(digits);
    const seconds = toSeconds(formatted);
    const maxSeconds = videoDuration > 0 ? videoDuration : Infinity;

    let finalValue = formatted;

    if (seconds > maxSeconds) {
      finalValue = fromSeconds(maxSeconds);
      setDigits(finalValue.replace(/\D/g, ""));
    }

    if (finalValue !== timestamp) {
      onTimestampChange(id, finalValue);
    }
  };

  const showTextarea = selected || description.trim().length > 0;
  const displayValue = formatDigits(digits);
  const inputWidth = displayValue.length > 5 ? "w-[72px]" : "w-[60px]";

  return (
    <Card
      ref={rootRef}
      className={cn(
        "relative bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
        "transition-all duration-200 border border-primary/50",
        selected ? "opacity-100" : "border-transparent",
      )}
      onClick={() => {
        if (!selected) onSelect(id);
      }}
    >
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-accent/30 h-8 w-8"
              onClick={(e) => e.stopPropagation()}
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
      </div>

      <img
        src={thumbnailUrl}
        alt={title || "Chapter thumbnail"}
        className="rounded-sm object-cover aspect-video max-w-60"
      />

      <TextArea
        autoFocus
        rows={1}
        placeholder="Enter chapter title"
        value={title}
        onChange={(e) => onTitleChange(id, e.target.value)}
        className="text-headline font-semibold text-foreground mt-4 p-0 border-0 rounded-none focus-within:shadow-none bg-transparent resize-none leading-tight placeholder:text-foreground/70"
      />

      <section className="flex items-center gap-2 text-label text-muted-foreground">
        <input
          className={cn(
            "bg-card rounded-full px-3 py-1 text-center outline-none focus:ring-1 focus:ring-ring transition-all tabular-nums",
            inputWidth,
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={commitChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <span>•</span>
        <span>{author}</span>
        <span>•</span>
        <span>{lastUpdated}</span>
      </section>

      <div className="flex flex-col gap-1.5 mt-4">
        <span className="text-label text-muted-foreground">Score</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              size="inline"
              variant="outline"
              className={cn(score === num && "bg-accent hover:bg-accent")}
              onClick={(e) => {
                e.stopPropagation();
                onScoreChange(id, num);
              }}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {showTextarea ? (
        selected ? (
          <TextArea
            placeholder="Write here..."
            value={description}
            onChange={(e) => onDescriptionChange(id, e.target.value)}
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
