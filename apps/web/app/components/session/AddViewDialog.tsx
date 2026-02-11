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

export function AddViewDialog({ open, onOpenChange, sessionId }: AddViewDialogProps) {
  const addView = useSessionStore((state) => state.actions.addView);

  // Form State
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle("");
    setFile(null);
  };

  const handleSubmit = () => {
    if (title && file) {
      addView(sessionId, { label: title, file });
      resetForm();
      onOpenChange(false);
    }
  };

  const isValid = title.trim() !== "" && file !== null;

  return (
    <OverlayCard
      open={open}
      onClose={() => onOpenChange(false)}
      title={<span className="pl-1">Upload Additional Session Media</span>}
      contentClassName="sm:max-w-[600px]"
      bodyClassName="flex flex-col gap-6"
    >
      {/* Media Title */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Media Title</Label>
        <TextInput
          placeholder="Title Entered Here"
          variant="form"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Upload Media */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Upload Media</Label>
        <FileUpload
          type="single"
          size={180}
          acceptedTypes={[".mp4", ".mov", ".webm"]}
          onFilesSelected={(files) => setFile(files[0])}
          className="w-full"
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