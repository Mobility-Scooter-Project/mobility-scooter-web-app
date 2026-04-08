import { useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { TextInput } from "~/components/TextInput";
import { useSessionStore } from "~/stores/useSessionStore";

interface AddViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onViewCreated?: (viewId: string) => void;
}

/**
 * Dialog for adding a new view to an existing session.
 */
export function AddViewDialog({
  open,
  onOpenChange,
  sessionId,
  onViewCreated,
}: AddViewDialogProps) {
  const addView = useSessionStore((state) => state.actions.addView);

  const [mediaTitle, setMediaTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    onOpenChange(false);

    setTimeout(() => {
      setMediaTitle("");
      setFile(null);
    }, 200);
  };

  const handleSubmit = () => {
    if (!mediaTitle.trim() || !file) return;

    const createdViewId = addView(sessionId, {
      label: mediaTitle.trim(),
      file,
    });

    if (createdViewId) onViewCreated?.(createdViewId);

    handleClose();
  };

  const isValid = mediaTitle.trim().length > 0 && file !== null;

  return (
    <OverlayCard
      open={open}
      onClose={handleClose}
      title="Add View"
      contentClassName="max-w-xl"
      bodyClassName="flex flex-col gap-3"
    >
      <TextInput
        id="view-media-title"
        label="Media Title"
        placeholder="e.g., Side Angle, Overhead, POV..."
        variant="form"
        value={mediaTitle}
        onChange={(e) => setMediaTitle(e.target.value)}
        autoFocus
      />

      <FileUpload
        id="view-media-file"
        label="Upload Media"
        type="single"
        size={120}
        acceptedTypes={[".mp4", ".mov", ".webm"]}
        disabled={!mediaTitle.trim()}
        onInput={(e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files?.[0]) setFile(files[0]);
        }}
      />

      <div className="flex justify-end w-full">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
        >
          Upload Video
        </Button>
      </div>
    </OverlayCard>
  );
}
