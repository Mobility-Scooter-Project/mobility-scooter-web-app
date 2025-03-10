import { zValidator } from "@hono/zod-validator";
import { createUserWithPassword } from "@services/auth";
import { Hono } from "hono";
import { createUserWithPasswordSchema } from "src/validators/auth";

const app = new Hono().post(
  "/register/emailpass",
  zValidator("json", createUserWithPasswordSchema),
  async (c) => {
    const { email, password, firstName, lastName, unitId } =
      c.req.valid("json");

    const { token, refreshToken } = await createUserWithPassword(
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
