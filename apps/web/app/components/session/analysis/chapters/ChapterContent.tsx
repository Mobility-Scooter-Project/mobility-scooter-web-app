import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { ChapterList } from "./ChapterList";
import { useChapterStore } from "~/stores/useChapterStore";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
  PanelSectionHeader,
} from "../../common/PanelSection";

/**
 * Tab content for the Chapters section in the Analysis Panel.
 * Displays a button to create new chapters and lists existing chapters.
 */
export function ChapterContent() {
  const handleNewChapter = useChapterStore(
    (state) => state.actions.handleNewChapter,
  );

  return (
    <PanelSection>
      <PanelSectionHeader>
        <Button variant="ghost" onClick={handleNewChapter}>
          <Icon name="ListPlus" />
          <span>New Chapter</span>
        </Button>
      </PanelSectionHeader>

      <PanelSectionBody>
        <PanelScrollArea>
          <ChapterList />
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}