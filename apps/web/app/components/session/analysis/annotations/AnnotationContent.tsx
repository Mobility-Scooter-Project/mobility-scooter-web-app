import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AnnotationList } from "./AnnotationList";
import { useAnnotationStore } from "~/stores/useAnnotationStore";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
  PanelSectionHeader,
} from "../../common/PanelSection";

/**
 * Tab content for the Annotations section in the Analysis Panel.
 * Displays a button to create new annotations and lists existing annotations.
 */
export function AnnotationContent() {
  const handleNewAnnotation = useAnnotationStore(
    (state) => state.actions.handleNewAnnotation,
  );

  return (
    <PanelSection>
      <PanelSectionHeader>
        <Button variant="ghost" onClick={handleNewAnnotation}>
          <Icon name="Plus" />
          <span>New Annotation</span>
        </Button>
      </PanelSectionHeader>

      <PanelSectionBody>
        <PanelScrollArea className="pb-4.5">
          <AnnotationList />
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}
