import { API_BASE_URL, UNIT_ID } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Response shape returned by GET /api/v1/units/:unitId/sessions */
export type SessionListItem = {
  sessionId: string;
  patientId: string;
  patientUuid: string;
  sessionDate: string;
  sessionTime: string;
};

/** Response shape returned by POST /api/v1/units/:unitId/sessions */
type CreateSessionResponse = {
  sessionId: string;
  patientUuid: string;
};

/** Request body for POST /api/v1/units/:unitId/sessions */
type CreateSessionDto = {
  patientId: string;
  sessionDate: string;
  sessionTime: string;
};

/** Response shape returned by GET /api/v1/units/:unitId/sessions/:sessionId/videos */
export type SessionVideoItem = {
  videoId: string;
  title: string;
  fileName: string;
};

/**
 * Builds the standard Authorization headers using the current access token.
 */
function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const sessionService = {
  /**
   * GET /api/v1/units/:unitId/sessions
   * Fetches all sessions for the current unit.
   */
  getAll: async (): Promise<SessionListItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/units/${UNIT_ID}/sessions`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.status}`);
    }

    return res.json();
  },

  /**
   * POST /api/v1/units/:unitId/sessions
   * Creates a new session in the current unit.
   *
   * @param dto - Session creation payload
   * @returns The created session's ID and resolved patient UUID
   */
  create: async (dto: CreateSessionDto): Promise<CreateSessionResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/units/${UNIT_ID}/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.status}`);
    }

    return res.json();
  },

  /**
   * GET /api/v1/units/:unitId/sessions/:sessionId/videos
   * Fetches all videos belonging to a session.
   *
   * @param sessionId - The session to list videos for
   * @returns Array of video metadata for the session
   */
  getSessionVideos: async (
    sessionId: string,
  ): Promise<SessionVideoItem[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/units/${UNIT_ID}/sessions/${sessionId}/videos`,
      { headers: authHeaders() },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch session videos: ${res.status}`);
    }

    return res.json();
  },
};
