import { zValidator } from "@hono/zod-validator";
import { dbMiddleware } from "@middleware/db";
import { validateApiKey } from "@middleware/validate-api-key";
import { authService } from "@services/auth";
import { Hono } from "hono";
import { Variables } from "src";
import {
  createUserWithPasswordSchema,
  signInWithPasswordSchema,
} from "src/validators/auth";

const app = new Hono<{ Variables: Variables }>()
  .post(
    "/emailpass/register",
    dbMiddleware,
    validateApiKey,
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
          token,
          refreshToken,
        }),
        { status: 200 }
      );
    }
  )
  .post(
    "/emailpass",
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
          token,
          refreshToken,
        }),
        { status: 200 }
      );
    }
  );

export default app;
