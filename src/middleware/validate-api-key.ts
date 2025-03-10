import { authService } from "@services/auth";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Middleware function to validate API key from Authorization header
 * @param c - The Context object containing request information
 * @param next - The Next function to be called if validation succeeds
 * @throws {HTTPException} With status 401 if Authorization header is missing or API key is invalid
 */
export const validateApiKey = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const [_, apiKey] = authHeader.split("Bearer ");
  const db = c.get("db");
  const result = await authService.retrieveApiKey(db, apiKey);

  if (!result) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await next();
};
