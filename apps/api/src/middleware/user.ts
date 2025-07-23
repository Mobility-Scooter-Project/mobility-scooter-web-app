import { JWT_SECRET } from "@config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import type { Context, Next } from "hono";
import { verify } from "hono/jwt";

/**
 * Middleware function to authenticate and process user information from JWT token.
 * 
 * @param c - The Context object containing request and variable information
 * @param next - The Next function to be called after middleware processing
 * @throws {HTTPError} 
 *  - HTTP 400 if no user header is provided
 *  - HTTP 401 if JWT verification fails
 *  - HTTP 401 if userId or sessionId is missing from verified token
 * 
 * @remarks
 * This middleware:
 * 1. Extracts user JWT from X-User header
 * 2. Verifies the JWT and extracts userId and sessionId
 * 3. Sets userId and sessionId in the context
 * 4. Adds user information to logger
 */
export const userMiddleware = async (c: Context, next: Next) => {
  const user = c.req.header("X-User");
  const { logger } = c.var;

  if (!user) {
    throw new HTTPError(
      HTTP_CODES.BAD_REQUEST,
      "No user data provided",
    )
  }

  let userId: string;
  let sessionId: string;

  try {
    const data = await verify(user, JWT_SECRET);
    userId = data.userId as string;
    sessionId = data.sessionId as string;
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      e,
      "Failed to authenticate user",
    );
  }

  if (!userId || !sessionId) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid user data",
    );
  }

  c.set("userId", userId);
  c.set("sessionId", sessionId);
  logger.assign({ userId, sessionId });

  await next();
};
