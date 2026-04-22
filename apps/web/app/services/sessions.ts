import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";
import { fetchWithAuthRetry } from "~/lib/fetchWithAuthRetry";

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

async function resolveUnitId(): Promise<string> {
  const { user, fetchUser, refreshAccessToken } = userAuthStore.getState();
  if (user?.unitId) return user.unitId;

  const refreshedUser = await fetchUser();
  if (refreshedUser?.unitId) return refreshedUser.unitId;

  const refreshed = await refreshAccessToken();
  if (refreshed) {
    const reloadedUser = await fetchUser();
    if (reloadedUser?.unitId) return reloadedUser.unitId;
  }

  throw new Error("User is missing unit assignment.");
}

export const sessionService = {
  /**
   * GET /api/v1/units/:unitId/sessions
   * Fetches all sessions for the current unit.
   */
  getAll: async (): Promise<SessionListItem[]> => {
    const unitId = await resolveUnitId();
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/units/${unitId}/sessions`, {
        headers: authHeaders(),
      }),
    );

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
    const unitId = await resolveUnitId();
    const res = await fetchWithAuthRetry(() =>
      fetch(`${API_BASE_URL}/api/v1/units/${unitId}/sessions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(dto),
      }),
    );

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
    const unitId = await resolveUnitId();
    const res = await fetchWithAuthRetry(() =>
      fetch(
        `${API_BASE_URL}/api/v1/units/${unitId}/sessions/${sessionId}/videos`,
        { headers: authHeaders() },
      ),
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch session videos: ${res.status}`);
    }

    return res.json();
  },
};
