import { useState, useEffect, type RefObject } from "react";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import type { Annotation } from "~/data/mock-session-data";

type InteractionType = "move" | "resize-start" | "resize-end";

interface InteractionState {
  id: string;
  action: InteractionType;
  startX: number;
  initStart: number;
  initEnd: number;
}

/**
 * Manages drag-and-drop interactions (move, resize) for annotations on the timeline.
 */
export function useAnnotationInteraction(
  containerRef: RefObject<HTMLDivElement | null>,
  totalDuration: number
) {
  const annotations = useAnnotationStore((state) => state.annotations);
  const updateAnnotation = useAnnotationStore((state) => state.actions.updateAnnotation);

  const [interaction, setInteraction] = useState<InteractionState | null>(null);

  // Helper to start interaction
  const startInteraction = (
    e: React.MouseEvent,
    id: string,
    action: InteractionType,
    currentStart: number,
    currentEnd: number
  ) => {
    e.stopPropagation(); // Prevent timeline seek
    setInteraction({
      id,
      action,
      startX: e.clientX,
      initStart: currentStart,
      initEnd: currentEnd,
    });
  };

  useEffect(() => {
    if (!interaction) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate time delta based on pixel movement
      const timeDelta = ((e.clientX - interaction.startX) / rect.width) * totalDuration;
      
      const ann = annotations.find((a) => a.id === interaction.id);
      if (!ann) return;

      if (interaction.action === "move") {
        const span = interaction.initEnd - interaction.initStart;
        let newStart = interaction.initStart + timeDelta;
        let newEnd = interaction.initEnd + timeDelta;
        
        // Clamp to timeline bounds
        if (newStart < 0) { newStart = 0; newEnd = span; }
        if (newEnd > totalDuration) { newEnd = totalDuration; newStart = totalDuration - span; }
        
        updateAnnotation(interaction.id, { startTime: newStart, endTime: newEnd });

      } else if (interaction.action === "resize-start") {
        const newStart = Math.max(0, Math.min(ann.endTime - 1, interaction.initStart + timeDelta));
        updateAnnotation(interaction.id, { startTime: newStart });

      } else if (interaction.action === "resize-end") {
        const newEnd = Math.max(ann.startTime + 1, Math.min(totalDuration, interaction.initEnd + timeDelta));
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
  }, [interaction, totalDuration, annotations, updateAnnotation, containerRef]);

  return {
    interactingId: interaction?.id ?? null,
    startInteraction,
  };
}