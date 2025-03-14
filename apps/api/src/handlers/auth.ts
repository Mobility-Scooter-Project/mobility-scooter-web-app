import { zValidator } from "@hono/zod-validator";
import { db, dbMiddleware } from "@middleware/db";
import { validateApiKey } from "@middleware/validate-api-key";
import { authService } from "@services/auth";
import { Hono } from "hono";
import { Variables } from "src";
import {
  createUserWithPasswordSchema,
  refreshTokenSchema,
  signInWithPasswordSchema,
} from "@validators/auth";
import { signInRateLimiter, signUpRateLimiter } from "@src/middleware/rate-limit";

const app = new Hono<{ Variables: Variables }>()
  .post(
    "/emailpass/register",
    dbMiddleware,
    validateApiKey,
    signUpRateLimiter,
    zValidator("json", createUserWithPasswordSchema),
    async (c) => {
      const { email, password, firstName, lastName, unitId } =
        c.req.valid("json");
      const db = c.get("db");

      const { token, refreshToken } = await authService.createUserWithPassword(
        db,
        email,
        password,
        firstName,
        lastName,
        unitId
      );

      return new Response(
        JSON.stringify({
          data: {
            token,
            refreshToken,
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  )
  .post(
    "/emailpass",
    signInRateLimiter,
    dbMiddleware,
    validateApiKey,
    zValidator("json", signInWithPasswordSchema),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const db = c.get("db");

      const { token, refreshToken } = await authService.signInWithPassword(
        db,
        email,
        password
      );

      return new Response(
        JSON.stringify({
          data: {
            token,
            refreshToken,
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  )
  .post(
    "/refresh",
    dbMiddleware,
    validateApiKey,
    zValidator("json", refreshTokenSchema),
    async (c) => {
      const { token } = c.req.valid("json");

      const { token: newToken, refreshToken } = await authService.refreshToken(
        db,
        token
      );

      return new Response(
        JSON.stringify({
          data: {
            token: newToken,
            refreshToken,
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  );

export default app;
