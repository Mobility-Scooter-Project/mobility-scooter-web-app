import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";
import { fetchWithAuthRetry } from "~/lib/fetchWithAuthRetry";

/** Response shape returned by POST /api/v1/videos/upload */
type VideoMetadataResponse = {
  id: string;
};

export type VideoRecord = {
  videoId: string;
  title: string;
  fileName: string;
};

type UploadFileOptions = {
  onTransferComplete?: () => void;
  onProgress?: (progress: { loaded: number; total: number }) => void;
};

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

/**
 * Builds Authorization headers using the current access token.
 * Does NOT include Content-Type so the browser can set the correct
 * multipart boundary for FormData uploads.
 */
function authHeaders(): Record<string, string> {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

function createUploadFileName(file: Pick<File, "name" | "type">): string {
  const fileName = file.name.split(/[\\/]/).pop() ?? "video";
  const dotIndex = fileName.lastIndexOf(".");
  const rawExtension =
    dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
  const extension =
    /^[.][a-z0-9]+$/i.test(rawExtension) && rawExtension.length > 1
      ? rawExtension
      : (MIME_TYPE_TO_EXTENSION[file.type] ?? ".mp4");
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}`;

  return `${uniqueId}${extension}`;
}

function parseVideoUrlResponse(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed) as string | { url?: string };
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed.url === "string") return parsed.url;
  } catch {
    // Plain-text response, which is the common case.
  }

  return trimmed;
}

export const videoService = {
  /**
   * POST /api/v1/videos/upload
   * Creates video metadata linked to a session and patient.
   *
   * @param sessionId   - The session to attach the video to
   * @param patientUuid - The internal patient UUID (from session creation)
   * @param file        - The uploaded video file
   * @param title       - Optional user-facing display name
   * @returns The created video record's ID
   */
  createMetadata: async (
    sessionId: string,
    patientUuid: string,
    file: Pick<File, "name" | "type">,
    title?: string,
  ): Promise<VideoMetadataResponse> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          sessionId,
          patientUuid,
          fileName: createUploadFileName(file),
          ...(title !== undefined ? { title } : {}),
        }),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to create video metadata: ${res.status}`);
    }

    return res.json();
  },

  /**
   * POST /api/v1/videos/:videoId/upload
   * Uploads the actual video file as multipart form data.
   *
   * @param videoId - The video metadata ID returned by createMetadata
   * @param file    - The video File to upload
   */
  uploadFile: async (
    videoId: string,
    file: File,
    options?: UploadFileOptions,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let transferComplete = false;

      const markTransferComplete = () => {
        if (transferComplete) {
          return;
        }

        transferComplete = true;
        options?.onProgress?.({ loaded: file.size, total: file.size });
        options?.onTransferComplete?.();
      };

      xhr.open("POST", `${API_BASE_URL}/api/v1/videos/${videoId}/upload`);

      Object.entries(authHeaders()).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.addEventListener("load", markTransferComplete);
      xhr.upload.addEventListener("progress", (event) => {
        const total = event.lengthComputable ? event.total : file.size;
        const loaded = Math.min(event.loaded, total);
        options?.onProgress?.({ loaded, total });
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            markTransferComplete();
          resolve();
          return;
        }

        reject(new Error(`Failed to upload video file: ${xhr.status}`));
      };

      xhr.onerror = () => {
        reject(new Error("Failed to upload video file: network error"));
      };

      xhr.onabort = () => {
        reject(new Error("Failed to upload video file: aborted"));
      };

      xhr.send(formData);
    });
  },

  /**
   * GET /api/v1/videos/:videoId/download
   * Returns a presigned URL to stream/download the video.
   *
   * @param videoId - The video metadata ID
   * @returns A presigned URL string valid for 24 hours
   */
  getPresignedUrl: async (videoId: string): Promise<string> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/download`, {
        headers: authHeaders(),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to get video URL: ${res.status}`);
    }

    const body = await res.text();
    return parseVideoUrlResponse(body);
  },

  getThumbnail: async (
    videoId: string,
    timestamp: number,
    signal?: AbortSignal,
  ): Promise<Blob> => {
    const params = new URLSearchParams({
      timestamp: String(Math.max(0, timestamp)),
    });

    const res = await fetchWithAuthRetry(() =>
      fetch(
        `${API_BASE_URL}/api/v1/videos/${videoId}/thumbnail?${params.toString()}`,
        {
          headers: authHeaders(),
          signal,
        },
      ),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch video thumbnail: ${res.status}`);
    }

    return res.blob();
  },

  getVideo: async (videoId: string): Promise<VideoRecord> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}`, {
        headers: authHeaders(),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch video metadata: ${res.status}`);
    }

    return res.json();
  },

  updateTitle: async (videoId: string, title: string): Promise<VideoRecord> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ title }),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to update video title: ${res.status}`);
    }

    return res.json();
  },
};
