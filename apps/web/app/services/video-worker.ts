import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";

/** Processing status for a single worker step. */
export type WorkerStepInfo = {
  step: string;
  status: string;
};

/** Overall worker status snapshot for a video. */
export type WorkerStatusInfo = {
  videoId: string;
  overallStatus: string | null;
  durationSec: number | null;
  steps: WorkerStepInfo[];
};

/** Detailed worker status for a single step. */
export type WorkerStepStatusInfo = {
  videoId: string;
  step: string;
  status: string | null;
  durationSec: number | null;
  attempts: number;
  lastError: string | null;
};

/** SSE event payload for a step-level status change. */
type StepSseEvent = {
  type: "step";
  videoId: string;
  step: string;
  status: string | null;
  durationSec: number | null;
  attempts: number;
  lastError: string | null;
};

/** SSE event payload for an overall (terminal) status change. */
type OverallSseEvent = {
  type: "overall";
  videoId: string;
  overallStatus: string | null;
  durationSec: number | null;
};

/** Union of all possible SSE event payloads. */
export type WorkerSseEvent = StepSseEvent | OverallSseEvent;

function authHeaders(): HeadersInit {
  const accessToken = userAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

export const videoWorkerService = {
  /**
   * GET /api/v1/video-worker/:videoId/status
   * Returns the overall processing status and per-step breakdown.
   */
  getStatus: async (videoId: string): Promise<WorkerStatusInfo> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/video-worker/${videoId}/status`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch worker status: ${res.status}`);
    }

    return res.json();
  },

  getStepStatus: async (
    videoId: string,
    step: string,
  ): Promise<WorkerStepStatusInfo> => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/video-worker/${videoId}/${step}/status`,
      { headers: authHeaders() },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch worker step status: ${res.status}`);
    }

    return res.json();
  },

  /**
   * Opens an SSE connection for real-time worker status updates.
   * The server auto-closes after a terminal overall status is emitted.
   *
   * @param videoId   - Video to subscribe to
   * @param onEvent   - Called for each parsed SSE event
   * @param onError   - Called on connection errors
   * @returns Cleanup function that closes the EventSource
   */
  subscribeToEvents: (
    videoId: string,
    onEvent: (event: WorkerSseEvent) => void,
    onError?: (error: Event) => void,
  ): (() => void) => {
    const accessToken = userAuthStore.getState().accessToken;
    const url = `${API_BASE_URL}/api/v1/video-worker/${videoId}/worker-events`;

    // EventSource doesn't support custom headers, so we pass the token as a query param.
    // The backend JWT middleware accepts this via `req.query.token`.
    const eventSource = new EventSource(
      accessToken ? `${url}?token=${encodeURIComponent(accessToken)}` : url,
    );

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as WorkerSseEvent;
        onEvent(payload);
      } catch {
        // Ignore malformed SSE messages.
      }
    };

    eventSource.onerror = (e) => {
      onError?.(e);
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    return () => eventSource.close();
  },
};
