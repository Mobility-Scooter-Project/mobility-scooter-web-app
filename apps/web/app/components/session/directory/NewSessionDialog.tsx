import { useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { TextInput } from "~/components/TextInput";
import { DatePickerInput } from "~/components/DatePickerInput";
import { useSessionStore } from "~/stores/useSessionStore";

interface NewSessionDialogProps {
  /* Whether the dialog is open */
  open: boolean;
  /* Callback to control the open state from parent */
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for creating a brand new session.
 * Initializes the session with one default view (media file).
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to control the open state from parent
 *
 * Form Validation:
 * - All fields are required to enable the "Create Session" button
 * - The file upload is disabled until the other fields are filled out to ensure proper data capture
 *
 * On submission, the new session is added to the store and the form resets.
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

    setTimeout(() => {
      setPatientId("");
      setDate(undefined);
      setMediaTitle("");
      setFile(null);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!patientId.trim() || !date || !mediaTitle.trim() || !file) return;

    try {
      await addSession({ patientId, date, mediaTitle, file });
    } catch (error) {
      console.error("Failed to create session:", error);
    }

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
      title="New Session"
      contentClassName="max-w-2xl"
      bodyClassName="flex flex-col gap-4"
    >
      {/* Patient ID */}
      <TextInput
        id="patient-id"
        label="Patient ID"
        placeholder="Enter patient ID..."
        variant="form"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        autoFocus
      />

      {/* Session Date */}
      <DatePickerInput
        label="Session Date"
        value={date}
        onChange={setDate}
        className="w-full"
      />

      {/* Media Title */}
      <TextInput
        id="media-title"
        label="Media Title"
        placeholder="e.g., Initial Assessment"
        variant="form"
        value={mediaTitle}
        onChange={(e) => setMediaTitle(e.target.value)}
      />

      {/* Upload Media */}
      <FileUpload
        id="media-file"
        label="Upload Media"
        type="single"
        size={120}
        acceptedTypes={[".mp4", ".mov", ".webm"]}
        disabled={!patientId.trim() || !date || !mediaTitle.trim()}
        onInput={(e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files?.[0]) setFile(files[0]);
        }}
      />

      {/* Footer */}
      <div className="flex justify-end w-full">
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
