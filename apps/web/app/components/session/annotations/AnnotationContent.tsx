import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { AnnotationCard } from "./AnnotationCard";
import { useAnnotations } from "~/hooks/useAnnotations";

export function AnnotationContent() {
  const {
    annotations,
    selectedId,
    handleSelect,
    handleDeselect,
    handleTitleChange,
    handleDescriptionChange,
    handleNewAnnotation,
  } = useAnnotations();

  const effectiveSelectedId = selectedId ?? null;

  return (
    <div>
      <Button
        variant="inline"
        className="text-foreground w-auto px-4 mt-2 mb-5"
        onClick={handleNewAnnotation}
      >
        <Icon name="Plus" />
        <span>New Annotation</span>
      </Button>

      <section className="flex flex-col gap-2">
        {annotations.map((annotation) => (
          <AnnotationCard
            key={annotation.id}
            title={annotation.title}
            timestamp={annotation.timestamp}
            author={annotation.author}
            date={annotation.date}
            description={annotation.description ?? ""}
            selected={effectiveSelectedId === annotation.id}
            onSelect={() => handleSelect(annotation.id)}
            onDeselect={handleDeselect}
            onTitleChange={(next) => handleTitleChange(annotation.id, next)}
            onDescriptionChange={(next) =>
              handleDescriptionChange(annotation.id, next)
            }
          />
        ))}
      </section>
    </div>
  );
}