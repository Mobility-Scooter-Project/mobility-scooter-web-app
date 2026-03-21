import { useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { TextInput } from "~/components/TextInput";
import { Label } from "~/components/ui/label";
import { useSessionStore } from "~/stores/useSessionStore";

interface AddViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
}

/**
 * Dialog for adding a new camera angle/view to an existing session.
 * Requires a title and a video file.
 */
export function AddViewDialog({
  open,
  onOpenChange,
  sessionId,
}: AddViewDialogProps) {
  const addView = useSessionStore((state) => state.actions.addView);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    // Small delay to prevent UI flicker before dialog closes
    setTimeout(() => {
      setTitle("");
      setFile(null);
    }, 200);
  };

  const handleSubmit = () => {
    if (!title.trim() || !file) return;

    addView(sessionId, { label: title, file });
    handleClose();
  };

  const isValid = title.trim().length > 0 && file !== null;

  return (
    <OverlayCard
      open={open}
      onClose={handleClose}
      title={<span className="pl-1">Upload Additional Session Media</span>}
      contentClassName="sm:max-w-[600px]"
      bodyClassName="flex flex-col gap-6"
    >
      {/* Media Title */}
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="view-title">Media Title</Label>
        <TextInput
          id="view-title"
          placeholder="e.g., Side Angle, Wide Shot..."
          variant="form"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      {/* Upload Media */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Upload Media</Label>
        <FileUpload
          type="single"
          size={180}
          acceptedTypes={[".mp4", ".mov", ".webm"]}
          className="w-full"
          disabled={!title.trim()}
          onInput={(e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.[0]) setFile(files[0]);
          }}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-2 w-full">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-auto"
        >
          Upload Video
        </Button>
      </div>
    </OverlayCard>
  );
}
