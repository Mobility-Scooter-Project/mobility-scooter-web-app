import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createUserWithPasswordSchema } from "src/validators/auth";

const app = new Hono().post(
  "/register/emailpass",
  zValidator("json", createUserWithPasswordSchema),
  (c) => {
    return new Response("OK", { status: 200 });
  }
);

export default app;
