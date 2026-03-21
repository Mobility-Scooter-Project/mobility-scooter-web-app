import { useAnnotationStore } from "~/stores/useAnnotationStore";
import { useSelectionStore } from "~/stores/useSelectionStore";
import { AnnotationCard } from "./AnnotationCard";

/**
 * Renders list of annotations for the current session, allowing users to select, update, or delete annotations.
 */
export function AnnotationList() {
  const annotations = useAnnotationStore((state) => state.annotations);
  
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedType = useSelectionStore((state) => state.selectedType);
  const { setSelection, clearSelection } = useSelectionStore((state) => state.actions);

  const {
    updateAnnotation,
    handleDeleteAnnotation,
  } = useAnnotationStore((state) => state.actions);

  return (
    <div className="flex flex-col gap-3">
      {annotations.map((annotation) => (
        <AnnotationCard
          key={annotation.id}
          data={annotation}
          isSelected={selectedType === "annotation" && selectedId === annotation.id}
          onSelect={() => setSelection("annotation", annotation.id)}
          onDeselect={clearSelection}
          onUpdate={(updates) => updateAnnotation(annotation.id, updates)}
          onDelete={() => handleDeleteAnnotation(annotation.id)}
        />
      ))}
    </div>
  );
}