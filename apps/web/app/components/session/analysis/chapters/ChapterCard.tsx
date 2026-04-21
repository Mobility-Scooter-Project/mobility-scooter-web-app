// app/components/session/analysis/chapters/ChapterCard.tsx

import { memo, useRef } from "react";
import { Loader2 } from "lucide-react";
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
import { selectActiveView, useSessionStore } from "~/stores/useSessionStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { useChapterThumbnail } from "./useChapterThumbnail";

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
    const seekTo = useVideoStore((state) => state.actions.seekTo);
    const videoId = useChapterStore((state) => state.videoId);
    const activeView = useSessionStore(selectActiveView);
    const { thumbnailUrl, isLoading } = useChapterThumbnail({
      videoId,
      timestamp: data.timestamp,
      fallbackUrl: data.thumbnailUrl,
      enabled: Boolean(videoId && !activeView?.uploading && !activeView?.uploadError),
    });

    useAutoDeselect(cardRef, isSelected, onDeselect);

    const stopCardClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
    };

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

    const handleCardClick = () => {
      seekTo(data.timestamp);
      if (!isSelected) {
        onSelect();
      }
    };

    return (
      <AnalysisCard
        ref={cardRef}
        isActive={isSelected}
        onClick={handleCardClick}
        className="gap-y-4.5"
      >
        {/* Thumbnail (and settings) */}
        <div className="flex items-start justify-between gap-3">
          <div className="relative w-full max-w-60 min-w-0 overflow-hidden rounded-sm">
            <img
              src={thumbnailUrl}
              alt={data.title || "Chapter thumbnail"}
              className="aspect-video w-full object-cover"
            />

            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/55">
                <Loader2 className="size-4 animate-spin text-foreground" />
              </div>
            ) : null}
          </div>

          <AnalysisCardSettings onDelete={onDelete} />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-2">
          <TextArea
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onClick={stopCardClick}
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
            onClick={stopCardClick}
            placeholder="Write here..."
          />
        )}
      </AnalysisCard>
    );
  },
);
