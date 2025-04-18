import { JWT_SECRET } from "@config/constants";
import { COMMON_HEADERS } from "@src/config/common-headers";
import { HTTP_CODES } from "@src/config/http-codes";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
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
    throw new HTTPException(HTTP_CODES.BAD_REQUEST, {
      res: new Response(
        JSON.stringify({ error: "No user data provided", data: null }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
      ),
    });
  }
  try {
    const { userId, sessionId } = await verify(user, JWT_SECRET);

    if (!userId || !sessionId) {
      throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
        res: new Response(
          JSON.stringify({ error: "Invalid user data", data: null }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }

    c.set("userId", userId);
    c.set("sessionId", sessionId);
    logger.assign({ userId, sessionId });

    await next();
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      res: new Response(
        JSON.stringify({ error: "Invalid user data", data: null }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
      ),
    });
  }
};
