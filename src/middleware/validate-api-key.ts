import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { retrieveApiKey } from "../services/auth";

export const validateApiKey = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
        throw new HTTPException(401, {message: "Unauthorized"});
    }

    const [_, apiKey] = authHeader.split("Bearer ");

    const result = await retrieveApiKey(apiKey);

    if (!result) {
        throw new HTTPException(401, {message: "Unauthorized"});
    }

    next();
}