import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AnnotationCard } from "./AnnotationCard";
import { useAnnotationStore } from "~/stores/useAnnotationStore";

export function AnnotationContent() {
  // states
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);

  // actions
  const {
    handleSelect,
    handleDeselect,
    handleTitleChange,
    handleDescriptionChange,
    handleNewAnnotation,
    updateAnnotation,
    handleDeleteAnnotation, // Imported
  } = useAnnotationStore((state) => state.actions);

  // just to ensure it's not undefined
  const effectiveSelectedId = selectedId ?? null;

  // render component
  return (
    <div>
      <Button
        variant="ghost"
        className="text-foreground my-3"
        onClick={handleNewAnnotation}
      >
        <Icon name="Plus" />
        <span>New Annotation</span>
      </Button>

      <section className="flex flex-col gap-2">
        {annotations.map((annotation) => (
          <AnnotationCard
            id={annotation.id}
            key={annotation.id}
            title={annotation.title}
            startTime={annotation.startTime}
            endTime={annotation.endTime}
            author={annotation.author}
            date={annotation.date}
            description={annotation.description ?? ""}
            selected={effectiveSelectedId === annotation.id}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onUpdate={updateAnnotation}
            onDelete={handleDeleteAnnotation} // Passed prop
          />
        ))}
      </section>
    </div>
  );
}