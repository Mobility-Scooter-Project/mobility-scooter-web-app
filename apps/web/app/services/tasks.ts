import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Response shape returned by GET /api/v1/videos/:videoId/tasks */
export type VideoTaskEntry = {
  taskNumber: number;
  timestamp: number;
  task: string;
  note: string | null;
  score: number | null;
};

function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const taskService = {
  /**
   * GET /api/v1/videos/:videoId/tasks
   * Fetches task detection results for a video.
   * Returns an empty array if task_detection has not completed yet.
   *
   * @param videoId - The video to fetch tasks for
   * @returns Array of detected tasks with timestamps and scores
   */
  getAll: async (videoId: string): Promise<VideoTaskEntry[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/videos/${videoId}/tasks`,
      { headers: authHeaders() },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch video tasks: ${res.status}`);
    }

    return res.json();
  },
};
