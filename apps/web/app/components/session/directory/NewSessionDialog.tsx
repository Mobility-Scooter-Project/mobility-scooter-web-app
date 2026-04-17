import { useState } from "react";
import { DatePickerInput } from "~/components/DatePickerInput";
import { TextInput } from "~/components/TextInput";
import { MediaUploadDialog } from "~/components/session/common/MediaUploadDialog";
import { useSessionStore } from "~/stores/useSessionStore";

interface NewSessionDialogProps {
  /* Whether the dialog is open */
  open: boolean;
  /* Callback to control the open state from parent */
  onOpenChange: (open: boolean) => void;
}

export function NewSessionDialog({
  open,
  onOpenChange,
}: NewSessionDialogProps) {
  const addSession = useSessionStore((state) => state.actions.addSession);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const sessionDetailsReady = patientId.trim().length > 0 && date !== undefined;

  const resetDialog = () => {
    setPatientId("");
    setDate(undefined);
  };

  return (
    <MediaUploadDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Session"
      contentClassName="max-w-2xl"
      uploadId="media-file"
      uploadLabel="Upload Media"
      uploadDisabled={!sessionDetailsReady}
      canContinue={sessionDetailsReady}
      submitLabel="Create Session"
      submittingLabel="Creating..."
      submitErrorMessage="Failed to create session."
      onReset={resetDialog}
      renderUploadFields={({ clearError }) => (
        <>
          <TextInput
            id="patient-id"
            label="Patient ID"
            placeholder="Enter patient ID..."
            variant="form"
            value={patientId}
            onChange={(e) => {
              clearError();
              setPatientId(e.target.value);
            }}
            autoFocus
          />

          <DatePickerInput
            label="Session Date"
            value={date}
            onChange={(nextDate) => {
              clearError();
              setDate(nextDate);
            }}
            className="w-full"
          />
        </>
      )}
      onSubmit={async (drafts) => {
        if (!date) {
          throw new Error("Session date is required.");
        }

        await addSession({
          patientId: patientId.trim(),
          date,
          media: drafts.map((draft) => ({
            title: draft.title.trim(),
            file: draft.media.file,
          })),
        });
      }}
    />
  );
}
