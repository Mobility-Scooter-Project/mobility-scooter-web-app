import { useMemo, useRef } from "react";
import { TrackLabel } from "./TrackLabel";
import { useTrackInteraction } from "./useTrackInteraction";
import { getSafeDuration, getTrackPosition } from "./timeline-track";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useAnnotationSelection } from "./useAnnotationSelection";

export function AnnotationTrack() {
  const containerRef = useRef<HTMLDivElement>(null);

  const duration = useVideoStore((state) => state.duration);
  const annotations = useAnnotationStore((state) => state.annotations);
  const updateAnnotation = useAnnotationStore(
    (state) => state.actions.updateAnnotation,
  );

  const {
    isAnnotationSelected,
    selectAnnotation,
  } = useAnnotationSelection();

  const safeDuration = getSafeDuration(duration);

  const annotationsById = useMemo(
    () => new Map(annotations.map((annotation) => [annotation.id, annotation])),
    [annotations],
  );

  const startInteraction = useTrackInteraction({
    containerRef,
    totalDuration: safeDuration,
    getItemById: (id) => annotationsById.get(id),
    onUpdate: (id, updates) => updateAnnotation(id, updates),
    onSelect: selectAnnotation,
  });

  return (
    <div ref={containerRef} className="relative h-6.5 w-full">
      {annotations.map((annotation) => (
        <TrackLabel
          key={annotation.id}
          variant="annotation"
          selected={isAnnotationSelected(annotation.id)}
          interactive
          style={getTrackPosition(annotation, safeDuration)}
          onClick={(event) => {
            event.stopPropagation();
            selectAnnotation(annotation.id);
          }}
          onMoveStart={(event) =>
            startInteraction(event, annotation.id, "move")
          }
          onResizeStart={(event) =>
            startInteraction(event, annotation.id, "resize-start")
          }
          onResizeEnd={(event) =>
            startInteraction(event, annotation.id, "resize-end")
          }
        />
      ))}
    </div>
  );
}