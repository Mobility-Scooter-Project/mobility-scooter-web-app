import { UploadedItem } from "~/components/UploadedItem";
import { TextInput } from "~/components/TextInput";
import { formatBytes, formatDuration } from "~/lib/utils";
import type { MediaDraft } from "./mediaDrafts";

interface MediaDetailsListProps {
  drafts: MediaDraft[];
  onTitleChange: (draftId: string, title: string) => void;
  onRemove: (draftId: string) => void;
}

export function MediaDetailsList({
  drafts,
  onTitleChange,
  onRemove,
}: MediaDetailsListProps) {
  return (
    <div className="flex w-full flex-col gap-4.5">
      {drafts.map((draft, index) => (
        <div key={draft.id} className="flex flex-col gap-2">
          <TextInput
            id={`media-title-${draft.id}`}
            label="Media Title"
            placeholder="Enter media title..."
            variant="form"
            value={draft.title}
            onChange={(e) => onTitleChange(draft.id, e.target.value)}
            autoFocus={index === 0}
          />

          <UploadedItem
            name={draft.media.file.name}
            sizeLabel={formatBytes(draft.media.file.size)}
            durationLabel={formatDuration(draft.media.durationSec)}
            previewUrl={draft.media.previewUrl}
            fileType={draft.media.file.type}
            natural={draft.media.natural}
            onRemove={() => onRemove(draft.id)}
          />
        </div>
      ))}
    </div>
  );
}
