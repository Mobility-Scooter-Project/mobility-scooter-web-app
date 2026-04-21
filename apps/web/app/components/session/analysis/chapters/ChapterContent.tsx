import { ListTree, Loader2 } from "lucide-react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { ChapterEmptyState } from "./ChapterEmptyState";
import { ChapterList } from "./ChapterList";
import { useChapterStore } from "~/stores/useChapterStore";
import { selectActiveView, useSessionStore } from "~/stores/useSessionStore";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
  PanelSectionHeader,
} from "../../common/PanelSection";
import { ProcessingNotice } from "../../common/ProcessingNotice";
/**
 * Tab content for the Chapters section in the Analysis Panel.
 * Displays a button to create new chapters and lists existing chapters.
 */
export function ChapterContent() {
  const handleNewChapter = useChapterStore(
    (state) => state.actions.handleNewChapter,
  );
  const chapters = useChapterStore((state) => state.chapters);
  const taskStatus = useChapterStore((state) => state.taskStatus);
  const activeView = useSessionStore(selectActiveView);

  const hasActiveView = Boolean(activeView);
  const hasChapters = chapters.length > 0;
  const isGenerating =
    activeView?.uploading ||
    taskStatus === "pending" ||
    taskStatus === "processing";
  const showGeneratingNotice = hasChapters && isGenerating;
  const showGeneratingEmptyState = hasActiveView && !hasChapters && isGenerating;
  const showEmptyState = hasActiveView && !hasChapters && !isGenerating;

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
          <div className="flex min-h-full flex-col gap-3">
            {showGeneratingNotice ? (
              <ProcessingNotice>
                You can still add chapters while more are generated.
              </ProcessingNotice>
            ) : null}

            {showGeneratingEmptyState ? (
              <ChapterEmptyState
                role="status"
                icon={<Loader2 className="size-4 animate-spin text-foreground" />}
                title="Automatic chapters are generating"
                description="You can still add your own while they finish."
              />
            ) : showEmptyState ? (
              <ChapterEmptyState
                icon={<ListTree className="size-4 text-foreground" />}
                title="No chapters yet"
                description="Add one to get started."
              />
            ) : (
              <ChapterList />
            )}
          </div>
        </PanelScrollArea>
      </PanelSectionBody>
    </PanelSection>
  );
}
