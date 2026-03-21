import { useRef } from "react";
import { VideoLabel } from "../VideoLabel";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePanelStore } from "~/stores/usePanelStore";
import { useVideoStore } from "~/stores/useVideoStore";
import { useAnnotationInteraction } from "~/hooks/useAnnotationInteraction";

/**
 * A track rendering interactable annotation segments.
 * Supports selecting, moving, and resizing annotations.
 */
export function AnnotationTrack() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const duration = useVideoStore((state) => state.duration);
  const safeDuration = duration > 0 ? duration : 1;

  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const handleSelect = useAnnotationStore((state) => state.actions.handleSelect);
  
  const setActivePanelTab = usePanelStore((state) => state.setActiveTab);

  const { startInteraction } = useAnnotationInteraction(containerRef, safeDuration);

  return (
    <div ref={containerRef} className="relative h-9 w-full">
      {annotations.map((ann) => (
        <VideoLabel
          key={ann.id}
          id={ann.id}
          type="annotation"
          startTime={ann.startTime}
          endTime={ann.endTime}
          totalDuration={safeDuration}
          selected={ann.id === selectedId}
          className="bg-sky-600/90 text-white prevent-seek"
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(ann.id);
            setActivePanelTab("annotations");
          }}
          onInteractionStart={(e, id, action) => {
            startInteraction(e, id, action, ann.startTime, ann.endTime);
          }}
        />
      ))}
    </div>
  );
}