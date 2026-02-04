"use client";

import * as React from "react";
import { Upload as UploadIcon } from "lucide-react";
import { cn, formatBytes, formatDuration } from "~/lib/utils";
import {
  acceptList,
  buildAcceptAttr,
  hasAllowedType,
  acceptHelperText,
} from "~/lib/accept";
import { useFileUpload, type Item } from "~/hooks/useFileUpload";
import { UploadingItem } from "./UploadingItem";
import { UploadedItem } from "./UploadedItem";
import { DropzoneBox } from "./DropzoneBox";

type UploadMode = "single" | "multi";

export type FileUploadProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  /* Optional label displayed above the upload area. */
  label?: React.ReactNode;
  /* Custom minimum height in pixels for the dropzone; width remains full. */
  size?: number;
  /*
   * Determines if the component handles one or many files.
   * @default "single"
   */
  type?: UploadMode;
  /*
   * Array of allowed file extensions or mime-types (e.g., [".png"]).
   * Defaults to a predefined list of common documents and images
   * (see `lib/accept.ts` for details)
   */
  acceptedTypes?: string[];
  /* Additional CSS classes for the root container. */
  containerClassName?: string;
  /* Additional CSS classes for the label. */
  labelClassName?: string;
  /* Additional CSS classes for the dropzone area. */
  className?: string;
};

/*
 * File Upload Component
 */
export function FileUpload({
  id,
  label,
  size,
  type = "single",
  acceptedTypes,
  disabled,
  containerClassName,
  labelClassName,
  className,
  multiple = true,
  ...rest
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const { items, addItems, removeItem } = useFileUpload(type === "multi");

  const acceptArr = acceptList(acceptedTypes);
  const acceptAttr = buildAcceptAttr(acceptedTypes);
  const helper = acceptHelperText(acceptArr);
  const generatedId = React.useId();
  const uploadId = id ?? generatedId;

  // Internal handler to validate and process files from the input or dropzone.
  const handleFiles = (list: FileList) => {
    const valid: Item[] = [];
    const files = Array.from(list);
    const rejected: string[] = [];

    for (const f of files) {
      if (hasAllowedType(f, acceptArr)) {
        valid.push({
          id: crypto.randomUUID(),
          file: f,
          status: "uploading",
          progress: 0,
          previewUrl: URL.createObjectURL(f),
          timer: null,
        });
        if (type === "single") break;
      } else {
        rejected.push(f.name);
      }
    }

    if (rejected.length) window.alert(`Rejected files: ${rejected.join(", ")}`);
    if (valid.length) addItems(valid);
  };

  const showDropzone = type === "multi" ? true : items.length === 0;

  return (
    <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={uploadId} className={cn("text-label", labelClassName)}>
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={uploadId}
        type="file"
        className="sr-only"
        multiple={type === "multi" ? multiple : false}
        accept={acceptAttr}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
        {...rest}
      />

      {showDropzone && (
        <DropzoneBox
          id={`${uploadId}-drop`}
          size={size}
          disabled={disabled}
          className={className}
          onPick={() => inputRef.current?.click()}
          onFiles={handleFiles}
        >
          <UploadIcon className="size-[34px] text-foreground" />
          <p className="text-label text-foreground text-center">
            Drag and drop files here or click to upload ({helper})
          </p>
        </DropzoneBox>
      )}

      {items.length > 0 && (
        <div
          className={cn(
            "flex w-full flex-col gap-2",
            type === "multi" && "mt-1",
          )}
        >
          {items.map((it) =>
            it.status === "uploading" ? (
              <UploadingItem
                key={it.id}
                name={it.file.name}
                progress={it.progress}
                onCancel={() => removeItem(it.id)}
              />
            ) : (
              <UploadedItem
                key={it.id}
                name={it.file.name}
                sizeLabel={formatBytes(it.file.size)}
                durationLabel={formatDuration(it.durationSec)}
                previewUrl={it.previewUrl}
                fileType={it.file.type}
                natural={it.natural}
                onRemove={() => removeItem(it.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
