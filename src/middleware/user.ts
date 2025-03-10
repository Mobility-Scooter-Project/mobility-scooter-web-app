import { JWT_SECRET } from "@config/constants";
import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";

export const userMiddleware = async (c: Context, next: Next) => {
  const { user } = await c.req.json();

  if (!user) {
    throw new HTTPException(400, {
      message: "User authentication is required",
    });
  }

  const { userId, sessionId } = await verify(user, JWT_SECRET);

  if (!userId || !sessionId) {
    throw new HTTPException(401, {
      message: "Failed to authenticate user",
    });
  }

  c.set("userId", userId);
  c.set("sessionId", sessionId);

  await next();
};
