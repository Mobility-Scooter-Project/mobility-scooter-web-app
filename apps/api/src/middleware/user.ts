import { JWT_SECRET } from "@config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import type { Context, Next } from "hono";
import { verify } from "hono/jwt";


/**
 * Middleware function for user authentication.
 * Verifies the user JWT token and sets userId and sessionId in the context.
 *
 * @param c - The Hono context object
 * @param next - The next middleware function to be called
 * @throws {HTTPException} 400 - If no user data is provided in the request
 * @throws {HTTPException} 401 - If user authentication fails
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
