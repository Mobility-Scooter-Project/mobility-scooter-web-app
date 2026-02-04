"use client";

import * as React from "react";
import { X, FileIcon } from "lucide-react";
import { Button } from "./Button";
import { useAspectRatio } from "~/hooks/useAspectRatio";

type UploadedItemProps = {
  /** The original filename. */
  name: string;
  /* Pre-formatted size string (e.g., "1.5 MB"). */
  sizeLabel: string;
  /* Pre-formatted duration string (e.g., "02:30"). */
  durationLabel: string;
  /* The blob URL for previewing the file. */
  previewUrl?: string;
  /* The MIME type of the file. */
  fileType: string;
  /* Intrinsic dimensions of the media for ratio preservation. */
  natural?: { w: number; h: number };
  /* Callback to trigger when the item is removed from the list. */
  onRemove: () => void;
};

/*
 * Displays a card for a successfully uploaded file, including a ratio-preserved
 * preview for images and videos and a removal action.
 */
export function UploadedItem({
  name,
  sizeLabel,
  durationLabel,
  previewUrl,
  fileType,
  natural,
  onRemove,
}: UploadedItemProps) {
  // Calculates dynamic width to preserve aspect ratio
  const { wrapRef, widthPx } = useAspectRatio(natural);

  // Ensures only trusted blob URLs hit DOM sinks
  const safeSrc = React.useMemo(() => {
    return previewUrl?.startsWith("blob:") ? previewUrl : undefined;
  }, [previewUrl]);

  return (
    <div className="flex w-full bg-background rounded-md pb-4.5 shadow-sm overflow-hidden border border-border">
      <div className="flex min-w-0 w-full flex-col mt-4.5 mx-4.5 gap-4.5">
        {/* Preview Container */}
        <div ref={wrapRef} className="h-28">
          <div
            className="rounded-sm bg-card inline-block shrink-0 align-top relative overflow-hidden"
            style={{
              height: "100%",
              width: widthPx ? `${widthPx}px` : undefined,
            }}
          >
            <div className="absolute inset-0 pointer-events-none shadow-inner-lg z-10" />

            {renderPreview(safeSrc, fileType, name)}
          </div>
        </div>

        {/* File Details */}
        <div className="flex flex-col gap-2">
          <h3 className="text-headline text-foreground truncate" title={name}>
            {name}
          </h3>
          <div className="flex flex-row gap-2 text-label text-foreground">
            <p>{durationLabel}</p>
            <p aria-hidden="true">•</p>
            <p>{sizeLabel}</p>
          </div>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="mt-2 mr-2 hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${name}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/*
 * Private helper to handle the conditional rendering of media types.
 */
function renderPreview(src: string | undefined, type: string, name: string) {
  if (!src) {
    return (
      <div className="w-full h-full grid place-items-center bg-accent">
        <FileIcon className="size-6 text-foreground" />
      </div>
    );
  }

  if (type.startsWith("image/")) {
    return <img src={src} alt={name} className="w-full h-full object-cover" />;
  }

  if (type.startsWith("video/")) {
    return (
      <video
        src={src}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <div className="w-full h-full grid place-items-center text-label uppercase text-foreground p-2">
      {type.split("/")[1] || "File"}
    </div>
  );
}
