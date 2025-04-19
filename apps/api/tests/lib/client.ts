import { hc } from "hono/client"
import type { AppType } from "../../src/"
import { TESTING_API_KEY, TESTING_BASE_URL } from "../config/constants"

export const client = hc<AppType>(TESTING_BASE_URL, {
    headers: {
        Authorization: `Bearer ${TESTING_API_KEY}`,
        "Content-Type": "application/json",
    }
})