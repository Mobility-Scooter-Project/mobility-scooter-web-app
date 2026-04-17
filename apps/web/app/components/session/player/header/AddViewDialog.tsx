import { MediaUploadDialog } from "~/components/session/common/MediaUploadDialog";
import { useSessionStore } from "~/stores/useSessionStore";

interface AddViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onViewCreated?: (viewId: string) => void;
}

/** Dialog for adding one or more views to an existing session. */
export function AddViewDialog({
  open,
  onOpenChange,
  sessionId,
  onViewCreated,
}: AddViewDialogProps) {
  const addView = useSessionStore((state) => state.actions.addView);

  return (
    <MediaUploadDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add View"
      contentClassName="max-w-xl"
      uploadId="view-media-file"
      uploadLabel="Upload Media"
      submitLabel="Add Views"
      submittingLabel="Adding..."
      submitErrorMessage="Failed to add views."
      onSubmit={async (drafts) => {
        const createdViewId = await addView(
          sessionId,
          drafts.map((draft) => ({
            title: draft.title.trim(),
            file: draft.media.file,
          })),
        );

        onViewCreated?.(createdViewId);
      }}
    />
  );
}
