import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Response shape returned by annotation endpoints. */
export type AnnotationResponse = {
  annotationId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  title: string;
  description: string;
  startTime: number;
  endTime: number | null;
};

/** Request body for creating or updating an annotation. */
type AnnotationDto = {
  title: string;
  description: string;
  startTime: number;
  endTime?: number | null;
};

function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const annotationService = {
  /**
   * GET /api/v1/videos/:videoId/annotations
   * Lists all annotations for a video.
   */
  getAll: async (videoId: string): Promise<AnnotationResponse[]> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/annotations`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch annotations: ${res.status}`);
    }

    return res.json();
  },

  /**
   * POST /api/v1/videos/:videoId/annotations
   * Creates a new annotation on a video.
   */
  create: async (
    videoId: string,
    dto: AnnotationDto,
  ): Promise<AnnotationResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/videos/${videoId}/annotations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      throw new Error(`Failed to create annotation: ${res.status}`);
    }

    return res.json();
  },

  /**
   * PUT /api/v1/videos/:videoId/annotations/:annotationId
   * Updates an existing annotation.
   */
  update: async (
    videoId: string,
    annotationId: string,
    dto: AnnotationDto,
  ): Promise<AnnotationResponse> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/videos/${videoId}/annotations/${annotationId}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(dto),
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to update annotation: ${res.status}`);
    }

    return res.json();
  },

  /**
   * DELETE /api/v1/videos/:videoId/annotations/:annotationId
   * Deletes an annotation.
   */
  delete: async (videoId: string, annotationId: string): Promise<void> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/videos/${videoId}/annotations/${annotationId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to delete annotation: ${res.status}`);
    }
  },
};
