import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { useMediaDrafts } from "~/hooks/useMediaDrafts";
import {
  areMediaDraftsReady,
  areMediaDraftTitlesFilled,
  type MediaDraft,
} from "./mediaDrafts";
import { MediaDetailsList } from "./MediaDetailsList";

const dialogCardClassName =
  "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]";
const dialogScrollClassName =
  "w-full min-h-0 max-h-[min(34rem,calc(100vh-14rem))] overflow-y-auto custom-scrollbar -mr-4.5 pr-4.5 lg:max-h-[min(36rem,calc(100vh-15rem))]";
const resetAfterCloseDelayMs = 200;

type Step = "upload" | "details";

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  contentClassName: string;
  uploadId: string;
  uploadLabel: string;
  uploadDisabled?: boolean;
  canContinue?: boolean;
  submitLabel: string;
  submittingLabel: string;
  submitErrorMessage: string;
  renderUploadFields?: (controls: { clearError: () => void }) => React.ReactNode;
  onSubmit: (drafts: MediaDraft[]) => Promise<void>;
  onReset?: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  title,
  contentClassName,
  uploadId,
  uploadLabel,
  uploadDisabled = false,
  canContinue = true,
  submitLabel,
  submittingLabel,
  submitErrorMessage,
  renderUploadFields,
  onSubmit,
  onReset,
}: MediaUploadDialogProps) {
  const { drafts, uploadItems, syncItems, updateTitle, remove, reset } =
    useMediaDrafts();
  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (open && resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const clearError = () => setSubmitError("");

  const resetDialog = () => {
    resetTimeoutRef.current = null;
    reset();
    setStep("upload");
    setIsSubmitting(false);
    setSubmitError("");
    onReset?.();
  };

  const handleClose = () => {
    onOpenChange(false);

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      resetDialog();
    }, resetAfterCloseDelayMs);
  };

  const handleContinue = () => {
    if (!canContinue || !areMediaDraftsReady(drafts)) {
      return;
    }

    clearError();
    setStep("details");
  };

  const handleBack = () => {
    clearError();
    setStep("upload");
  };

  const handleSubmit = async () => {
    if (!areMediaDraftTitlesFilled(drafts)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit(drafts);
      handleClose();
    } catch (error) {
      console.error(`Failed to submit ${title.toLowerCase()}:`, error);
      setSubmitError(getErrorMessage(error, submitErrorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueEnabled = canContinue && areMediaDraftsReady(drafts);
  const submitEnabled = areMediaDraftTitlesFilled(drafts);

  return (
    <OverlayCard
      open={open}
      onClose={handleClose}
      title={title}
      contentClassName={contentClassName}
      cardClassName={dialogCardClassName}
      bodyClassName="flex min-h-0 flex-col gap-4 overflow-hidden"
    >
      {step === "upload" ? (
        <>
          <div className={dialogScrollClassName}>
            <div className="flex w-full flex-col gap-4">
              {renderUploadFields?.({ clearError })}

              <FileUpload
                id={uploadId}
                label={uploadLabel}
                type="multi"
                size={120}
                acceptedTypes={[".mp4", ".mov", ".webm"]}
                disabled={uploadDisabled}
                items={uploadItems}
                onItemsChange={(items) => {
                  clearError();
                  syncItems(items);
                }}
                cleanupPreviewUrlsOnUnmount={false}
              />
            </div>
          </div>

          <div className="flex w-full justify-end">
            <Button
              onClick={handleContinue}
              disabled={!continueEnabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className={dialogScrollClassName}>
            <MediaDetailsList
              drafts={drafts}
              onTitleChange={(draftId, titleValue) => {
                clearError();
                updateTitle(draftId, titleValue);
              }}
              onRemove={(draftId) => {
                clearError();
                remove(draftId);
              }}
            />
          </div>

          {submitError ? (
            <p className="w-full text-xs leading-snug text-destructive/90" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!submitEnabled || isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </>
      )}
    </OverlayCard>
  );
}
