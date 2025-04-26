import { hc } from "hono/client";
import type { AppType } from "../../../api/src/"
import { API_KEY, API_BASE_URL } from "~/config/constants";

/**
 * Creates and configures an API client with the specified headers.
 * 
 * @param headers - Optional object containing additional HTTP headers to include in requests
 * @returns A configured HTTP client instance of type AppType
 * @example
 * ```typescript
 * const client = getApiClient({ 'Content-Type': 'application/json' });
 * ```
 */
export const getApiClient = (headers?: object) => {
    return hc<AppType>(API_BASE_URL, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            ...headers
        }
    });
}