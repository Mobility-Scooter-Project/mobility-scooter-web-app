// app/components/session/analysis/chapters/ChapterCard.tsx

import { memo, useRef } from "react";
import { TextArea } from "~/components/TextArea";
import { Button } from "~/components/Button";
import { TimeInput } from "../../common/TimeInput";
import { useAutoDeselect } from "~/hooks/useAutoDeselect";
import { AnalysisCard } from "../../common/AnalysisCard";
import { AnalysisCardSettings } from "../../common/AnalysisCardSettings";
import { cn } from "~/lib/utils";
import { validateTimeBoundary } from "~/lib/timeline-calculations";
import type { Chapter } from "~/data/mock-session-data";
import { useVideoStore } from "~/stores/useVideoStore";

interface ChapterCardProps {
  data: Chapter;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onUpdate: (updates: Partial<Chapter>) => void;
  onDelete: () => void;
}

export const ChapterCard = memo(
  ({
    data,
    isSelected,
    onSelect,
    onDeselect,
    onUpdate,
    onDelete,
  }: ChapterCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const videoDuration = useVideoStore((state) => state.duration);

    useAutoDeselect(cardRef, isSelected, onDeselect);

    const handleTimeChange = (newSeconds: number) => {
      const validTime = validateTimeBoundary(
        "start",
        newSeconds,
        Infinity,
        videoDuration,
      );

      if (validTime !== data.timestamp) {
        onUpdate({ timestamp: validTime });
      }
    };

    const showTextarea =
      isSelected || (data.description && data.description.trim().length > 0);

    return (
      <AnalysisCard
        ref={cardRef}
        isActive={isSelected}
        onClick={!isSelected ? onSelect : undefined}
        className="gap-y-4.5"
      >
        {/* Thumbnail (and settings) */}
        <div className="flex items-start justify-between">
          {data.thumbnailUrl && (
            <img
              src={data.thumbnailUrl}
              alt={data.title || "Chapter thumbnail"}
              className="rounded-sm object-cover aspect-video w-full max-w-60 min-w-0"
            />
          )}

          <AnalysisCardSettings onDelete={onDelete} />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2">
          <TextArea
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter Chapter Title"
            className="text-headline"
          />
          <div className="flex flex-wrap items-center gap-2 text-label">
            <TimeInput
              valueSeconds={data.timestamp}
              onChangeSeconds={handleTimeChange}
            />
            <span>•</span>
            <span>{data.author}</span>
            <span>•</span>
            <span>{data.lastUpdated}</span>
          </div>
        </div>

        {/* Score Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-label">Score</span>
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="icon"
                className={cn(
                  data.score === val && "bg-accent hover:bg-accent",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ score: data.score === val ? null : val });
                }}
              >
                {val}
              </Button>
            ))}
          </div>
        </div>

        {/* Description */}
        {showTextarea && (
          <TextArea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Write here..."
          />
        )}
      </AnalysisCard>
    );
  },
);
