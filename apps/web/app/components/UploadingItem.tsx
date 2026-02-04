"use client";

import { X } from "lucide-react";
import { Button } from "./Button";

type UploadingItemProps = {
  name: string;
  progress: number;
  onCancel: () => void;
};

export function UploadingItem({
  name,
  progress,
  onCancel,
}: UploadingItemProps) {
  return (
    <div className="flex w-full bg-background rounded-md pb-4.5 shadow-sm overflow-hidden">
      <div className="flex min-w-0 w-full flex-col mt-4.5 mx-4.5 gap-2">
        <h3 className="text-headline text-foreground truncate">{name}</h3>
        <p className="text-label truncate">
          Uploading {Math.min(100, Math.round(progress))}%
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="mt-2 mr-2"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        aria-label="Cancel upload"
      >
        <X className="size-4 text-foreground" />
      </Button>
    </div>
  );
}
