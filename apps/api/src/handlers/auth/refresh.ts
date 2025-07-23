import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@src/index";
import container from "@src/lib/container";
import { dbMiddleware, postgresDB } from "@src/middleware/db";
import { AuthService } from "@src/services/auth";
import { refreshTokenSchema, sessionBodySchema } from "@src/validators/auth";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono<{ Variables: Variables }>().post(
  "/",
  describeRoute({
    summary: "Refresh an access token",
    description: "Refresh an access token using a refresh token",
    tags: ["auth"],
    requestBody: {
      content: {
        "application/json": {
          schema: zValidator("json", refreshTokenSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Access token refreshed successfully",
        content: {
          "application/json": {
            schema: resolver(sessionBodySchema),
          },
        },
      },
    },
  }),
  dbMiddleware,
  zValidator("json", refreshTokenSchema),
  async (c) => {
    const authService = c.get("container").get(AuthService);

    const { token } = c.req.valid("json");

    const { token: newToken, refreshToken } = await authService.refreshToken(
      postgresDB,
      token,
    );

    return c.json({
      data: {
        token: newToken,
        refreshToken,
      },
      error: null,
    });
  },
);

export default app;
