import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TextArea } from "~/components/TextArea";
import { useVideoStore } from "~/stores/useVideoStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/Dropdown";

// Shared Utilities (Ensure these are imported from where you placed them)
import { useAutoDeselect } from "~/hooks/useAutoDeselect";
import { TimeInput } from "../common/TimeInput";
import { 
  formatTimeDigits, 
  timeStringToSeconds, 
  getDigitsFromSeconds 
} from "~/lib/formatters";

interface ChapterCardProps {
  id: number;
  thumbnailUrl: string;
  title: string;
  timestamp: string; // "MM:SS" or "H:MM:SS"
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
  onDelete: (id: number) => void;
}

/**
 * A card representing a video chapter (timestamp bookmark).
 */
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

  // Sync state when timestamp prop changes (external update)
  useEffect(() => {
    const raw = timestamp.replace(/\D/g, "");
    setDigits(parseInt(raw || "0", 10).toString());
  }, [timestamp]);

  // Hook: Handle clicking outside to deselect
  useAutoDeselect(rootRef, selected, onDeselect);

  const commitChange = () => {
    // 1. Parse current digits to seconds
    const seconds = timeStringToSeconds(formatTimeDigits(digits));
    
    // 2. Clamp to duration
    const maxDuration = videoDuration > 0 ? videoDuration : Infinity;
    const clampedSeconds = Math.min(Math.max(0, seconds), maxDuration);

    // 3. Normalize BACK to digits (Fixes "00:99" -> "0139")
    const newDigits = getDigitsFromSeconds(clampedSeconds);
    
    // Update local state and notify parent
    setDigits(newDigits);
    
    const formatted = formatTimeDigits(newDigits);
    if (formatted !== timestamp) {
      onTimestampChange(id, formatted);
    }
  };

  const showTextarea = selected || description.trim().length > 0;

  return (
    <Card
      ref={rootRef}
      className={cn(
        "relative bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm cursor-default",
        "transition-all duration-200 border border-primary/50",
        selected ? "opacity-100" : "border-transparent",
      )}
      onClick={() => !selected && onSelect(id)}
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

      <section className="flex items-center gap-2 text-label text-muted-foreground mt-1">
        {/* Pill-shaped Time Input */}
        <div className="flex items-center justify-center bg-card rounded-full px-2 py-0.5 border border-transparent hover:border-border transition-colors">
            <TimeInput
            value={digits}
            onChange={setDigits}
            onBlur={commitChange}
            className="text-foreground font-medium" 
            />
        </div>
        
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