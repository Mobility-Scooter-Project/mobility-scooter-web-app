/**
 * Probes a video file to retrieve its total duration.
 *
 * @param file - The video File object to probe.
 * @returns A promise that resolves to the duration in seconds, or undefined if not a video.
 * @throws Error if metadata cannot be loaded or if the URL is deemed unsafe.
 */
export async function probeDuration(file: File): Promise<number | undefined> {
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

    // Ensures the source is a trusted local blob before assignment.
    if (url.startsWith("blob:")) {
      v.setAttribute("src", url);
    } else {
      cleanup();
      reject(new Error("Unsafe URL source"));
    }
  });
}

/**
 * Retrieves the natural width and height of an image or video file.
 *
 * @param file - The File object used to determine the media type.
 * @param src - The object URL (blob) representing the media.
 * @returns A promise resolving to dimensions { w, h }. Defaults to 9:16 ratio if processing fails.
 */
export function getNaturalDims(
  file: File,
  src: string,
): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    /**
     * Security Fix: Protocol validation and use of setAttribute to mitigate XSS risks.
     */
    if ((isImage || isVideo) && src.startsWith("blob:")) {
      if (isImage) {
        const img = new Image();
        img.onload = () =>
          resolve({ w: img.naturalWidth || 9, h: img.naturalHeight || 16 });
        img.setAttribute("src", src);
      } else {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () =>
          resolve({ w: v.videoWidth || 9, h: v.videoHeight || 16 });
        v.setAttribute("src", src);
      }
    } else {
      resolve({ w: 9, h: 16 });
    }
  });
}
