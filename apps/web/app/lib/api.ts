import { hc } from "hono/client";
import type { AppType } from "../../../api/src/"
import { API_KEY, API_BASE_URL } from "~/config/constants";

export const apiClient = hc<AppType>(API_BASE_URL, {
    headers: {
        Authorization: `Bearer ${API_KEY}`
    }
});