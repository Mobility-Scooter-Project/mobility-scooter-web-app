import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

export type StabilityInference = {
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  predictedClass: number;
  confidence: number;
};

function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const stabilityService = {
  /**
   * GET /api/v1/videos/:videoId/stability
   * Returns stability inference windows for a processed video.
   */
  getAll: async (videoId: string): Promise<StabilityInference[]> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/stability`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stability inferences: ${res.status}`);
    }

    return res.json();
  },
};
