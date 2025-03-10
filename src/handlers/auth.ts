import { zValidator } from "@hono/zod-validator";
import { dbMiddleware } from "@middleware/db";
import { validateApiKey } from "@middleware/validate-api-key";
import { authService, createUserWithPassword } from "@services/auth";
import { Hono } from "hono";
import { Variables } from "src";
import { createUserWithPasswordSchema } from "src/validators/auth";

const app = new Hono<{ Variables: Variables }>().post(
  "/register/emailpass",
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
);

export default app;
