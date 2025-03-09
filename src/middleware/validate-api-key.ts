import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { retrieveApiKey } from "../services/auth";

export const validateApiKey = async (c: Context, next: Next) => {
    const apiKey = c.req.header("Authorization");

    if (!apiKey) {
        throw new HTTPException(401, {message: "Unauthorized"});
    }

    const result = await retrieveApiKey(apiKey);

    if (!result) {
        throw new HTTPException(401, {message: "Unauthorized"});
    }

    next();
}