import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";
import { fetchWithAuthRetry } from "~/lib/fetchWithAuthRetry";
import type { Coordinate } from "~/types/overlay";

/** A single row of keypoint data returned by the API. */
export type KeypointRow = {
  frameIndex: number;
  timestamp: number;
  angle: number;
  keypoints: Record<string, Coordinate>;
};

/** Response shape for the incremental `/since` endpoint. */
type KeypointsSinceResponse = { items: KeypointRow[] };

function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const keypointService = {
  /**
   * GET /api/v1/videos/:videoId/keypoints/nearest?timestamp=&maxDeltaSeconds=
   * Returns the closest keypoint row to the given timestamp, or `null`
   * if nothing exists within `maxDeltaSeconds`.
   */
  getNearest: async (
    videoId: string,
    timestampSec: number,
    maxDeltaSeconds = 1,
  ): Promise<KeypointRow | null> => {
    const params = new URLSearchParams({
      timestamp: String(timestampSec),
      maxDeltaSeconds: String(maxDeltaSeconds),
    });

    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/keypoints/nearest?${params}`, {
        headers: authHeaders(),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch nearest keypoint: ${res.status}`);
    }

    return res.json() as Promise<KeypointRow | null>;
  },

  /**
   * GET /api/v1/videos/:videoId/keypoints/since?afterFrameIndex=&limit=
   * Returns keypoint rows with `frameIndex > afterFrameIndex`, ascending.
   * Used for incremental / streaming fetch during playback.
   *
   * @param afterFrameIndex - Cursor; rows after this index are returned (default -1 = from start)
   * @param limit           - Max rows per request (default 1000, server caps at 5000)
   */
  getSince: async (
    videoId: string,
    afterFrameIndex = -1,
    limit = 1000,
  ): Promise<KeypointRow[]> => {
    const params = new URLSearchParams({
      afterFrameIndex: String(afterFrameIndex),
      limit: String(limit),
    });

    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/keypoints/since?${params}`, {
        headers: authHeaders(),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch keypoints since: ${res.status}`);
    }

    const body = (await res.json()) as KeypointsSinceResponse;
    return body.items;
  },
};
