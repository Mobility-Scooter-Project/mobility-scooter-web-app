"use client";

import * as React from "react";
import { Upload as UploadIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { UploadingItem } from "./UploadingItem";
import { UploadedItem } from "./UploadedItem";
import { DropzoneBox } from "./DropzoneBox";

/* ================================= helpers ================================ */
function formatBytes(n: number) {
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  return n >= GB ? `${(n / GB).toFixed(1)} GB` : `${(n / MB).toFixed(1)} MB`;
}
function formatDuration(sec?: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const s = Math.round(sec),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    r = s % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
        r
      ).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
async function probeDuration(file: File): Promise<number | undefined> {
  if (!file.type.startsWith("video/")) return undefined;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.remove();
    };
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = v.duration;
      cleanup();
      resolve(Number.isFinite(d) ? d : undefined);
    };
    v.onerror = () => {
      cleanup();
      reject(new Error("metadata error"));
    };
    v.src = url;
  });
}
function getNaturalDims(
  file: File,
  src: string
): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () =>
        resolve({ w: img.naturalWidth || 9, h: img.naturalHeight || 16 });
      img.src = src;
    } else if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () =>
        resolve({ w: v.videoWidth || 9, h: v.videoHeight || 16 });
      v.src = src;
    } else {
      resolve({ w: 9, h: 16 });
    }
  });
}

/* ---- accept/validation ---- */
const DEFAULT_ACCEPT = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
function buildAcceptAttr(list?: string[]) {
  return (list && list.length ? list : DEFAULT_ACCEPT).join(",");
}
function acceptList(list?: string[]) {
  return list && list.length ? list : DEFAULT_ACCEPT;
}
function hasAllowedType(file: File, accept: string[]) {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  for (const rule of accept) {
    const r = rule.trim().toLowerCase();
    if (!r) continue;
    if (r.startsWith(".")) {
      if (name.endsWith(r)) return true;
    } else if (r.endsWith("/*")) {
      const major = r.slice(0, -2);
      if (mime.startsWith(major + "/")) return true;
    } else {
      if (mime === r) return true;
    }
  }
  return false;
}
function acceptHelperText(acceptArr: string[]) {
  return acceptArr
    .map((x) => (x.endsWith("/*") ? x.replace("/*", "") : x))
    .join(", ");
}

/* ================================ FileUpload =============================== */
type UploadMode = "single" | "multi";

type FileUploadProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  label?: React.ReactNode;
  size?: number; // min-height in px (full width)
  type?: UploadMode; // "single" | "multi" (default "single")
  acceptedTypes?: string[]; // overrides default list
  containerClassName?: string;
  labelClassName?: string;
  className?: string;
  multiple?: boolean; // still respected in "multi"; ignored in "single"
  onFilesSelected?: (files: File[]) => void;
};

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
  onFilesSelected,
  ...rest
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  type Item = {
    id: string;
    file: File;
    status: "uploading" | "done";
    progress: number;
    previewUrl?: string;
    durationSec?: number;
    natural?: { w: number; h: number };
    timer?: number | null;
  };

  const [items, setItems] = React.useState<Item[]>([]);
  const generatedId = React.useId();
  const uploadId = id ?? generatedId;

  const acceptArr = acceptList(acceptedTypes);
  const acceptAttr = buildAcceptAttr(acceptedTypes);
  const helper = acceptHelperText(acceptArr);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const startUploadSimulation = React.useCallback((itemId: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const copy = [...prev];
      const speed = 4 + Math.random() * 6;
      const tickMs = 120;
      const timer = window.setInterval(() => {
        setItems((state) => {
          const i = state.findIndex((x) => x.id === itemId);
          if (i === -1) {
            clearInterval(timer);
            return state;
          }
          const cur = state[i];
          if (cur.status === "done") {
            clearInterval(timer);
            return state;
          }
          const nextProg = Math.min(100, cur.progress + speed);
          const updated = { ...cur, progress: nextProg };
          const next = [...state];
          next[i] = updated;
          if (nextProg >= 100) {
            clearInterval(timer);
            (async () => {
              const duration = await probeDuration(cur.file).catch(
                () => undefined
              );
              const nat = await getNaturalDims(cur.file, cur.previewUrl || "");
              setItems((fin) => {
                const j = fin.findIndex((x) => x.id === itemId);
                if (j === -1) return fin;
                const doneItem: Item = {
                  ...fin[j],
                  status: "done",
                  progress: 100,
                  durationSec: duration,
                  natural: nat,
                  timer: null,
                };
                const arr = [...fin];
                arr[j] = doneItem;
                return arr;
              });
            })();
          }
          return next;
        });
      }, tickMs);
      copy[idx] = { ...copy[idx], timer };
      return copy;
    });
  }, []);

  const cleanupItem = (i: Item) => {
    if (i.timer) clearInterval(i.timer);
    if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
  };

  const addFilesMulti = (list: FileList) => {
    if (!list?.length) return;
    const files = Array.from(list);
    const accepted: Item[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      if (hasAllowedType(f, acceptArr)) {
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(f);
        accepted.push({
          id,
          file: f,
          status: "uploading",
          progress: 0,
          previewUrl,
          timer: null,
        });
      } else {
        rejected.push(f.name);
      }
    }
    if (rejected.length)
      window.alert(`Some files are not allowed:\n\n${rejected.join("\n")}`);
    if (accepted.length) {
      setItems((prev) => [...accepted, ...prev]); // newest on top
      requestAnimationFrame(() => {
        for (const a of accepted) startUploadSimulation(a.id);
      });
    }

    if (accepted.length && onFilesSelected) {
      onFilesSelected(accepted.map(i => i.file));
    }
  };

  const addFilesSingle = (list: FileList) => {
    if (!list?.length) return;
    const files = Array.from(list);
    let chosen: File | undefined;
    for (const f of files) {
      if (hasAllowedType(f, acceptArr)) {
        chosen = f;
        break;
      }
    }
    if (!chosen) {
      window.alert("No allowed file types in selection.");
      return;
    }
    if (files.length > 1) {
      window.alert("Only one file allowed. Using the first valid file.");
    }
    // cleanup current (if any)
    setItems((prev) => {
      prev.forEach(cleanupItem);
      return [];
    });

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(chosen);
    const next: Item = {
      id,
      file: chosen,
      status: "uploading",
      progress: 0,
      previewUrl,
      timer: null,
    };
    setItems([next]);
    requestAnimationFrame(() => startUploadSimulation(id));

    if (next && onFilesSelected) {
      onFilesSelected([next.file]);
    }
  };

  const addFiles = (list: FileList) => {
    if (type === "single") addFilesSingle(list);
    else addFilesMulti(list);
  };

  const removeItem = (rid: string) => {
    setItems((prev) => {
      const toRemove = prev.find((i) => i.id === rid);
      if (toRemove) cleanupItem(toRemove);
      return prev.filter((i) => i.id !== rid);
    });
  };

  React.useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach(cleanupItem);
        return prev;
      });
    };
  }, []);

  const showDropzone = type === "multi" ? true : items.length === 0;

  return (
    <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
      {label && (
        <label htmlFor={uploadId} className={cn("text-label", labelClassName)}>
          {label}
        </label>
      )}

      {/* hidden input */}
      <input
        ref={inputRef}
        id={uploadId}
        type="file"
        className="sr-only"
        multiple={type === "multi" ? multiple : false}
        accept={acceptAttr}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.currentTarget.value = "";
        }}
        {...rest}
      />

      {/* Dropzone (hidden in single mode after a file is added) */}
      {showDropzone && (
        <DropzoneBox
          id={`${uploadId}-drop`}
          size={size}
          disabled={disabled}
          className={className}
          onPick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          onFiles={addFiles}
        >
          <UploadIcon className="size-[34px] text-foreground" />
          <p className="text-label text-foreground text-center lg:max-w-[60%]">
            Drag and drop files here or click to upload ({helper})
          </p>
        </DropzoneBox>
      )}

      {/* Items */}
      {items.length > 0 && (
        <div
          className={`flex w-full flex-col gap-2 ${type === "multi" && "mt-1"}`}
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
            )
          )}
        </div>
      )}
    </div>
  );
}
