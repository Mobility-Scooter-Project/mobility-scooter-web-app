import { useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { TextInput } from "~/components/TextInput";
import { DatePickerInput } from "~/components/DatePickerInput";
import { useSessionStore } from "~/stores/useSessionStore";
import { Label } from "~/components/ui/label";

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for creating a brand new session.
 * Initializes the session with one default view (media file).
 */
export function NewSessionDialog({
  open,
  onOpenChange,
}: NewSessionDialogProps) {
  const addSession = useSessionStore((state) => state.actions.addSession);

  // Form State
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [mediaTitle, setMediaTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after animation
    setTimeout(() => {
      setPatientId("");
      setDate(undefined);
      setMediaTitle("");
      setFile(null);
    }, 200);
  };

  const handleSubmit = () => {
    if (!patientId.trim() || !date || !mediaTitle.trim() || !file) return;

    addSession({ patientId, date, mediaTitle, file });
    handleClose();
  };

  const isValid =
    patientId.trim().length > 0 &&
    date !== undefined &&
    mediaTitle.trim().length > 0 &&
    file !== null;

  return (
    <OverlayCard
      open={open}
      onClose={handleClose}
      title={<span className="pl-1">New Session</span>}
      contentClassName="sm:max-w-[600px]"
      bodyClassName="flex flex-col gap-6"
    >
      {/* Patient ID */}
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="patient-id">Patient ID</Label>
        <TextInput
          id="patient-id"
          placeholder="Enter patient ID..."
          variant="form"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          autoFocus
        />
      </div>

      {/* Session Date */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Session Date</Label>
        <DatePickerInput value={date} onChange={setDate} className="w-full" />
      </div>

      {/* Media Title */}
      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="media-title">Media Title</Label>
        <TextInput
          id="media-title"
          placeholder="e.g., Initial Assessment"
          variant="form"
          value={mediaTitle}
          onChange={(e) => setMediaTitle(e.target.value)}
        />
      </div>

      {/* Upload Media */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Upload Media</Label>
        <FileUpload
          type="single"
          size={120}
          acceptedTypes={[".mp4", ".mov", ".webm"]}
          className="w-full"
          // 1. Disable the upload area until other fields are filled
          disabled={!patientId.trim() || !date || !mediaTitle.trim()}
          // 2. Capture the file as soon as it is selected
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
        >
          Create Session
        </Button>
      </div>
    </OverlayCard>
  );
}
