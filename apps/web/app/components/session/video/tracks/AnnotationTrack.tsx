import { useState, useEffect, useRef } from "react";
import { VideoLabel } from "../VideoLabel";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { usePanelStore } from "~/stores/usePanelStore";
import { useVideoStore } from "~/stores/useVideoStore";

export function AnnotationTrack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const duration = useVideoStore((state) => state.duration);
  const safeDuration = duration > 0 ? duration : 1;

  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const { handleSelect, updateAnnotation } = useAnnotationStore((state) => state.actions);
  const setActivePanelTab = usePanelStore((state) => state.setActiveTab);

  // Interaction State
  const [interaction, setInteraction] = useState<{
    id: number;
    action: "move" | "resize-start" | "resize-end";
    startX: number;
    initStart: number;
    initEnd: number;
  } | null>(null);

  useEffect(() => {
    if (!interaction) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const timeDelta = ((e.clientX - interaction.startX) / rect.width) * safeDuration;
      
      const ann = annotations.find((a) => a.id === interaction.id);
      if (!ann) return;

      if (interaction.action === "move") {
        const span = interaction.initEnd - interaction.initStart;
        let newStart = interaction.initStart + timeDelta;
        let newEnd = interaction.initEnd + timeDelta;
        
        if (newStart < 0) { newStart = 0; newEnd = span; }
        if (newEnd > safeDuration) { newEnd = safeDuration; newStart = safeDuration - span; }
        
        updateAnnotation(interaction.id, { startTime: newStart, endTime: newEnd });
      } else if (interaction.action === "resize-start") {
        const newStart = Math.max(0, Math.min(ann.endTime - 1, interaction.initStart + timeDelta));
        updateAnnotation(interaction.id, { startTime: newStart });
      } else if (interaction.action === "resize-end") {
        const newEnd = Math.max(ann.startTime + 1, Math.min(safeDuration, interaction.initEnd + timeDelta));
        updateAnnotation(interaction.id, { endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      setInteraction(null);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = interaction.action === "move" ? "grabbing" : "ew-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [interaction, safeDuration, annotations, updateAnnotation]);

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
          isInteracting={interaction?.id === ann.id}
          className="bg-sky-600/90 text-white prevent-seek" // prevent-seek class for timeline
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(ann.id);
            setActivePanelTab("annotations");
          }}
          onInteractionStart={(e, id, action) => {
            e.stopPropagation(); // prevent seek
            setInteraction({
              id,
              action,
              startX: e.clientX,
              initStart: ann.startTime,
              initEnd: ann.endTime,
            });
          }}
        />
      ))}
    </div>
  );
}