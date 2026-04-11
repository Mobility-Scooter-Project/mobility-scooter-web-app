import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Response shape returned by POST /api/v1/videos/upload */
type VideoMetadataResponse = {
  id: string;
};

/**
 * Builds Authorization headers using the current access token.
 * Does NOT include Content-Type so the browser can set the correct
 * multipart boundary for FormData uploads.
 */
function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const videoService = {
  /**
   * POST /api/v1/videos/upload
   * Creates video metadata linked to a session and patient.
   *
   * @param sessionId   - The session to attach the video to
   * @param patientUuid - The internal patient UUID (from session creation)
   * @param fileName    - Display name / original file name
   * @returns The created video record's ID
   */
  createMetadata: async (
    sessionId: string,
    patientUuid: string,
    fileName: string,
  ): Promise<VideoMetadataResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/videos/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ sessionId, patientUuid, fileName }),
    });

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
  uploadFile: async (videoId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE_URL}/api/v1/videos/${videoId}/upload`,
      {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to upload video file: ${res.status}`);
    }
  },

  /**
   * GET /api/v1/videos/:videoId/download
   * Returns a presigned URL to stream/download the video.
   *
   * @param videoId - The video metadata ID
   * @returns A presigned URL string valid for 24 hours
   */
  getPresignedUrl: async (videoId: string): Promise<string> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/videos/${videoId}/download`,
      { headers: authHeaders() },
    );

    if (!res.ok) {
      throw new Error(`Failed to get video URL: ${res.status}`);
    }

    return res.text();
  },
};
