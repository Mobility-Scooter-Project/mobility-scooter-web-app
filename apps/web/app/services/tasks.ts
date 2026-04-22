import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";
import { fetchWithAuthRetry } from "~/lib/fetchWithAuthRetry";

/** Response shape returned by GET /api/v1/videos/:videoId/tasks */
export type VideoTaskEntry = {
  taskId: string;
  timestamp: number;
  task: string;
  note: string | null;
  score: number | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

type CreateVideoTaskDto = {
  timestamp: number;
  task: string;
  note?: string | null;
  score?: number | null;
};

type UpdateVideoTaskDto = {
  timestamp?: number;
  task?: string;
  note?: string | null;
  score?: number | null;
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
   */
  getAll: async (videoId: string): Promise<VideoTaskEntry[]> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/tasks`, {
        headers: authHeaders(),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch video tasks: ${res.status}`);
    }

    return res.json();
  },

  create: async (
    videoId: string,
    dto: CreateVideoTaskDto,
  ): Promise<VideoTaskEntry> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/tasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(dto),
      }),
    );

    if (!res.ok) {
      throw new Error(`Failed to create video task: ${res.status}`);
    }

    return res.json();
  },

  update: async (
    videoId: string,
    taskId: string,
    dto: UpdateVideoTaskDto,
  ): Promise<VideoTaskEntry> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(
        `${API_BASE_URL}/api/v1/videos/${videoId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(dto),
        },
      ),
    );

    if (!res.ok) {
      throw new Error(`Failed to update video task: ${res.status}`);
    }

    return res.json();
  },

  delete: async (videoId: string, taskId: string): Promise<void> => {
    const res = await fetchWithAuthRetry(() =>
      fetch(
        `${API_BASE_URL}/api/v1/videos/${videoId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      ),
    );

    if (!res.ok) {
      throw new Error(`Failed to delete video task: ${res.status}`);
    }
  },
};
