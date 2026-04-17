import { memo, useRef } from "react";
import { TextArea } from "~/components/TextArea";
import { TimeInput } from "../../common/TimeInput";
import { useAutoDeselect } from "~/hooks/useAutoDeselect";
import { validateTimeBoundary } from "~/lib/timeline-calculations";
import type { Annotation } from "~/data/mock-session-data";
import { AnalysisCard } from "../../common/AnalysisCard";
import { AnalysisCardSettings } from "../../common/AnalysisCardSettings";
import { useVideoStore } from "~/stores/useVideoStore";

interface AnnotationCardProps {
  /* The annotation data to display and edit */
  data: Annotation;
  /* Whether this annotation is currently selected */
  isSelected: boolean;
  /* Callback to select this annotation (e.g. when card is clicked) */
  onSelect: () => void;
  /* Callback to deselect this annotation (e.g. when clicking outside) */
  onDeselect: () => void;
  /* Callback to update this annotation with partial changes (e.g. title, times, description) */
  onUpdate: (updates: Partial<Annotation>) => void;
  /* Callback to delete this annotation */
  onDelete: () => void;
}

/**
 * Card component for displaying and editing an annotation within the session analysis view.
 * Shows title, time range, author/date, and description. Allows inline editing of all fields.
 */
export const AnnotationCard = memo(
  ({
    data,
    isSelected,
    onSelect,
    onDeselect,
    onUpdate,
    onDelete,
  }: AnnotationCardProps) => {
    const videoDuration = useVideoStore((state) => state.duration);
    const stopCardClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
    };

    const handleStartChange = (newStart: number) => {
      const validStart = validateTimeBoundary(
        "start",
        newStart,
        data.endTime,
        videoDuration,
      );
      if (validStart !== data.startTime) onUpdate({ startTime: validStart });
    };

    const handleEndChange = (newEnd: number) => {
      const validEnd = validateTimeBoundary(
        "end",
        newEnd,
        data.startTime,
        videoDuration,
      );
      if (validEnd !== data.endTime) onUpdate({ endTime: validEnd });
    };

    const cardRef = useRef<HTMLDivElement>(null);
    useAutoDeselect(cardRef, isSelected, onDeselect);

    const showTextArea = isSelected || (data.description && data.description.trim().length > 0);

    return (
      <AnalysisCard
        ref={cardRef}
        isActive={isSelected}
        onClick={!isSelected ? onSelect : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <TextArea
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onClick={stopCardClick}
            placeholder="Enter Title"
            className="text-headline"
          />

          <AnalysisCardSettings onDelete={onDelete} />
        </div>

        {/* Details Bar */}
        <div className="flex flex-wrap gap-2 text-label">
          <TimeInput
            valueSeconds={data.startTime}
            onChangeSeconds={handleStartChange}
          />
          <span>—</span>
          <TimeInput
            valueSeconds={data.endTime}
            onChangeSeconds={handleEndChange}
          />
          <span>•</span>
          <span>{data.author}</span>
          <span>•</span>
          <span>{data.date}</span>
        </div>

        {/* Description */}
        {showTextArea && (
          <TextArea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            onClick={stopCardClick}
            placeholder="Write here..."
            className="text-base"
          />
        )}
      </AnalysisCard>
    );
  },
);
