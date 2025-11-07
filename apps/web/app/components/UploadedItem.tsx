"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type UploadedItemProps = {
  name: string;
  sizeLabel: string; // preformatted (e.g., "120.0 MB" / "1.2 GB")
  durationLabel: string; // preformatted (e.g., "00:45")
  previewUrl?: string;
  fileType: string;
  natural?: { w: number; h: number };
  onRemove: () => void;
};

export function UploadedItem({
  name,
  sizeLabel,
  durationLabel,
  previewUrl,
  fileType,
  natural,
  onRemove,
}: UploadedItemProps) {
  // fixed-height wrapper, width computed from intrinsic ratio
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [wrapH, setWrapH] = React.useState<number>(0);
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const measure = () =>
      setWrapH(wrapRef.current!.getBoundingClientRect().height);
    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current);
    measure();
    return () => ro.disconnect();
  }, []);

  const ratio = natural ? natural.w / natural.h : 9 / 16;
  const widthPx = wrapH > 0 ? wrapH * ratio : undefined;

  return (
    <div className="flex w-full bg-background rounded-md pb-4.5 shadow-sm overflow-hidden">
      <div className="flex min-w-0 w-full flex-col mt-4.5 mx-4.5 gap-2">
        <div ref={wrapRef} className="h-28">
          <div
            className="rounded-sm bg-muted inline-block shrink-0 align-top relative overflow-hidden"
            style={{
              height: "100%",
              width: widthPx ? `${widthPx}px` : undefined,
            }}
          >
            <div className="absolute inset-0 pointer-events-none shadow-inner-lg" />
            {previewUrl &&
              (fileType.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : fileType.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-foreground/70">
                  {fileType || "file"}
                </div>
              ))}
            {!previewUrl && (
              <div className="w-full h-full grid place-items-center text-xs text-foreground/70">
                {fileType || "file"}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold truncate">{name}</h3>
          <div className="flex flex-row gap-2 text-label">
            <p>{durationLabel}</p>
            <p>•</p>
            <p>{sizeLabel}</p>
          </div>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="mt-2 mr-2"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove file"
      >
        <X className="size-4 text-foreground" />
      </Button>
    </div>
  );
}
