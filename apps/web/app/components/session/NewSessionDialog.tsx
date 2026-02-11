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

export function NewSessionDialog({ open, onOpenChange }: NewSessionDialogProps) {
  const addSession = useSessionStore((state) => state.actions.addSession);

  // Form State
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [mediaTitle, setMediaTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setPatientId("");
    setDate(undefined);
    setMediaTitle("");
    setFile(null);
  };

  const handleSubmit = () => {
    if (patientId && date && mediaTitle && file) {
      addSession({ patientId, date, mediaTitle, file });
      resetForm();
      onOpenChange(false);
    }
  };

  const isValid = patientId.trim() !== "" && date !== undefined && mediaTitle.trim() !== "" && file !== null;

  return (
    <OverlayCard
      open={open}
      onClose={() => onOpenChange(false)}
      title={<span className="pl-1">New Session</span>}
      contentClassName="sm:max-w-[600px]"
      bodyClassName="flex flex-col gap-6"
    >
      {/* Patient ID */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Patient ID</Label>
        <TextInput
          placeholder="Enter patient ID..."
          variant="form"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        />
      </div>

      {/* Session Date */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Session Date</Label>
        <DatePickerInput
          value={date}
          onChange={setDate}
          className="w-full"
        />
      </div>

      {/* Media Title */}
      <div className="flex flex-col gap-2 w-full">
        <Label>Media Title</Label>
        <TextInput
          placeholder="Enter media title..."
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
          onFilesSelected={(files) => setFile(files[0])}
          className="w-full"
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