import { isTokenExpired, userAuthStore } from "./auth";

type RetryableRequest = () => Promise<Response>;

/**
 * Runs a request and refreshes the access token once on 401
 * only when the current access token is actually expired.
 * Request factories should build fresh auth headers on each call.
 */
export async function fetchWithAuthRetry(
  request: RetryableRequest,
): Promise<Response> {
  let response = await request();
  if (response.status !== 401) {
    return response;
  }

  const accessToken = userAuthStore.getState().accessToken;
  if (!accessToken || !isTokenExpired(accessToken, 0)) {
    return response;
  }

  const refreshed = await userAuthStore.getState().refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  response = await request();
  return response;
}
