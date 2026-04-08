import { API_BASE_URL, UNIT_ID } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Response shape returned by GET /api/v1/units/:unitId/sessions */
type SessionListItem = {
  sessionId: string;
  patientId: string;
  sessionDate: string;
  sessionTime: string;
};

/** Response shape returned by POST /api/v1/units/:unitId/sessions */
type CreateSessionResponse = {
  sessionId: string;
  patientId: string;
};

/** Request body for POST /api/v1/units/:unitId/sessions */
type CreateSessionDto = {
  patientInputId: string;
  sessionDate: string;
  sessionTime: string;
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
    const res = await fetch(
      `${API_BASE_URL}/api/v1/units/${UNIT_ID}/sessions`,
      { headers: authHeaders() },
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
   * @returns The created session's ID and resolved patient ID
   */
  create: async (dto: CreateSessionDto): Promise<CreateSessionResponse> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/units/${UNIT_ID}/sessions`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(dto),
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.status}`);
    }

    return res.json();
  },
};
