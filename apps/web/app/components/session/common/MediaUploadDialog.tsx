import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/Button";
import { FileUpload } from "~/components/FileUpload";
import { OverlayCard } from "~/components/OverlayCard";
import { cn } from "~/lib/utils";
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

type Step = "upload" | "details";

type UploadProgress = {
  completed: number;
  received: number;
  total: number;
  transferredBytes: number;
  totalBytes: number;
};

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
  onUploadsReceived?: () => void | Promise<void>;
  onSubmit: (
    drafts: MediaDraft[],
    controls: { setUploadProgress: (progress: UploadProgress) => void },
  ) => Promise<void>;
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
  onUploadsReceived,
  onSubmit,
  onReset,
}: MediaUploadDialogProps) {
  const { drafts, uploadItems, syncItems, updateTitle, remove, reset } =
    useMediaDrafts();
  const [step, setStep] = useState<Step>("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedUploadCount, setSelectedUploadCount] = useState(0);
  const submissionIdRef = useRef(0);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    const safeToClose = uploadProgress?.total
      ? uploadProgress.received >= uploadProgress.total
      : false;

    if (!isSubmitting || safeToClose) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSubmitting, uploadProgress]);

  const clearError = () => setSubmitError("");

  const resetDialog = useCallback(() => {
    submissionIdRef.current += 1;
    reset();
    setStep("upload");
    setIsSubmitting(false);
    setSubmitError("");
    setUploadProgress(null);
    setSelectedUploadCount(0);
    onReset?.();
  }, [onReset, reset]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      resetDialog();
    }

    wasOpenRef.current = open;
  }, [open, resetDialog]);

  const handleClose = useCallback((force = false) => {
    const canCloseWhileSubmitting =
      uploadProgress?.total !== undefined &&
      uploadProgress.received >= uploadProgress.total;

    if (isSubmitting && !force && !canCloseWhileSubmitting) {
      return;
    }

    onOpenChange(false);
  }, [isSubmitting, onOpenChange, uploadProgress]);

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

    const submissionId = submissionIdRef.current + 1;
    submissionIdRef.current = submissionId;
    setSelectedUploadCount(drafts.length);
    setIsSubmitting(true);
    setSubmitError("");
    const totalBytes = drafts.reduce((sum, draft) => sum + draft.media.file.size, 0);
    setUploadProgress({
      completed: 0,
      received: 0,
      total: drafts.length,
      transferredBytes: 0,
      totalBytes,
    });

    try {
      await onSubmit(drafts, {
        setUploadProgress: (progress) => {
          if (submissionIdRef.current !== submissionId) {
            return;
          }

          setUploadProgress(progress);
        },
      });

      if (submissionIdRef.current !== submissionId) {
        return;
      }

      handleClose(true);
    } catch (error) {
      if (submissionIdRef.current !== submissionId) {
        return;
      }

      console.error(`Failed to submit ${title.toLowerCase()}:`, error);
      setSubmitError(getErrorMessage(error, submitErrorMessage));
    } finally {
      if (submissionIdRef.current === submissionId) {
        setIsSubmitting(false);
      }
    }
  };

  const continueEnabled = canContinue && areMediaDraftsReady(drafts);
  const submitEnabled = areMediaDraftTitlesFilled(drafts);
  const totalUploads = uploadProgress?.total ?? 0;
  const completedUploads = uploadProgress?.completed ?? 0;
  const receivedUploads = uploadProgress?.received ?? 0;
  const transferredBytes = uploadProgress?.transferredBytes ?? 0;
  const totalBytes = uploadProgress?.totalBytes ?? 0;
  const transferProgressPercent = Math.round(
    totalBytes > 0
      ? (transferredBytes / totalBytes) * 100
      : totalUploads > 0
        ? (receivedUploads / totalUploads) * 100
        : 0,
  );
  const safeToClose = totalUploads > 0 && receivedUploads >= totalUploads;
  const canDismissDialog = !isSubmitting || safeToClose;
  const totalLabel = `${Math.max(totalUploads, 1)} video${Math.max(totalUploads, 1) === 1 ? "" : "s"}`;
  const skippedUploads = Math.max(0, selectedUploadCount - totalUploads);
  const hasMeasuredByteProgress = transferredBytes > 0;
  const showIndeterminateProgress =
    isSubmitting &&
    !hasMeasuredByteProgress &&
    receivedUploads < totalUploads &&
    totalUploads > 0;

  let uploadStatusLabel =
    totalUploads === 1 ? "Uploading video" : "Uploading videos";
  let uploadStatusDetail = "Keep this page open for a moment.";
  let uploadProgressNote = `${receivedUploads} of ${totalLabel} ready.`;

  if (skippedUploads > 0) {
    uploadProgressNote += ` ${skippedUploads} could not be queued.`;
  }

  if (safeToClose && completedUploads < totalUploads) {
    const remainingUploads = totalUploads - completedUploads;
    uploadStatusLabel = "All set";
    uploadStatusDetail = "Closing this window...";
    uploadProgressNote = `Wrapping up ${remainingUploads} more video${remainingUploads === 1 ? "" : "s"}.`;
  } else if (safeToClose) {
    uploadStatusLabel = "All set";
    uploadStatusDetail = "Closing this window...";
    uploadProgressNote = `All ${totalLabel} are ready.`;
  }

  useEffect(() => {
    if (!open || !isSubmitting || !safeToClose) {
      return;
    }

    void onUploadsReceived?.();
    handleClose(true);
  }, [handleClose, onUploadsReceived, open, isSubmitting, safeToClose]);

  return (
    <OverlayCard
      open={open}
      onClose={canDismissDialog ? () => handleClose(isSubmitting) : undefined}
      closeOnBackdrop={canDismissDialog}
      closeOnEsc={canDismissDialog}
      title={title}
      contentClassName={contentClassName}
      cardClassName={dialogCardClassName}
      bodyClassName="flex min-h-0 flex-col gap-4 overflow-hidden"
    >
      <div className="relative flex min-h-0 w-full flex-col gap-4">
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
              <p
                className="w-full text-xs leading-snug text-destructive/90"
                role="alert"
              >
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

        {isSubmitting ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/94 px-6 text-center">
            <div className="flex w-full max-w-sm flex-col items-center gap-3">
              <Loader2 className="size-6 animate-spin text-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-title-2 font-semibold text-foreground">
                  {uploadStatusLabel}
                </p>
                <p className="text-sm text-foreground/70">
                  {uploadStatusDetail}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/70">
                  <div
                    className={cn(
                      "h-full rounded-full bg-foreground transition-[width] duration-300",
                      showIndeterminateProgress && "animate-pulse",
                    )}
                    style={{ width: `${showIndeterminateProgress ? 35 : transferProgressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-foreground/70">
                  {uploadProgressNote}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </OverlayCard>
  );
}
