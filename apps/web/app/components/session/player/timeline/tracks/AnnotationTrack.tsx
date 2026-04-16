import { useCallback, useMemo, useRef, useState } from "react";
import { TrackLabel } from "./TrackLabel";
import { useTrackInteraction } from "./useTrackInteraction";
import { getSafeDuration, getTrackPixelStyle } from "./timeline-track";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useAnnotationSelection } from "./useAnnotationSelection";
import { useTrackRowLayout } from "./useTrackRowLayout";

type FrozenAnnotationLayout = {
  activeId: string;
  containerHeight: number;
  containerWidth: number;
  stylesById: Map<string, React.CSSProperties>;
};

export function AnnotationTrack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frozenLayout, setFrozenLayout] = useState<FrozenAnnotationLayout | null>(
    null,
  );

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
  const {
    items: positionedAnnotations,
    containerHeight,
    containerWidth,
  } = useTrackRowLayout(containerRef, annotations, safeDuration);

  const annotationsById = useMemo(
    () => new Map(annotations.map((annotation) => [annotation.id, annotation])),
    [annotations],
  );

  const positionedStyleById = useMemo(
    () =>
      new Map(
        positionedAnnotations.map(({ item, style }) => [item.id, style] as const),
      ),
    [positionedAnnotations],
  );

  const handleInteractionStart = useCallback(
    (id: string) => {
      setFrozenLayout({
        activeId: id,
        containerHeight,
        containerWidth,
        stylesById: new Map(positionedStyleById),
      });
    },
    [containerHeight, containerWidth, positionedStyleById],
  );

  const handleInteractionEnd = useCallback(() => {
    setFrozenLayout(null);
  }, []);

  const startInteraction = useTrackInteraction({
    containerRef,
    totalDuration: safeDuration,
    getItemById: (id) => annotationsById.get(id),
    onUpdate: (id, updates) => updateAnnotation(id, updates),
    onSelect: selectAnnotation,
    onInteractionStart: handleInteractionStart,
    onInteractionEnd: handleInteractionEnd,
  });

  const containerHeightPx = frozenLayout?.containerHeight ?? containerHeight;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${containerHeightPx}px` }}
    >
      {annotations.map((annotation) => {
        const frozenStyle = frozenLayout?.stylesById.get(annotation.id);
        const liveStyle = positionedStyleById.get(annotation.id);
        const isActiveDragLabel = frozenLayout?.activeId === annotation.id;
        const style =
          isActiveDragLabel && frozenLayout
            ? {
                ...getTrackPixelStyle(
                  annotation,
                  safeDuration,
                  frozenLayout.containerWidth,
                ),
                top: frozenStyle?.top ?? liveStyle?.top ?? "0px",
              }
            : (frozenStyle ?? liveStyle);

        if (!style) return null;

        return (
          <TrackLabel
            key={annotation.id}
            variant="annotation"
            selected={isAnnotationSelected(annotation.id)}
            interactive
            style={style}
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
        );
      })}
    </div>
  );
}
