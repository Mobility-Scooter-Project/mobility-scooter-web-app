import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import auth from "@handlers/auth";
import storage from "@handlers/storage";
import { DB } from "@middleware/db";

export type Variables = {
  db: DB;
  userId?: string;
  sessionId?: string;
};

export const app = new Hono<{ Variables: Variables }>()
  .use(logger())
  .get("/healthcheck", (c) => {
    return new Response("OK", { status: 200 });
  })
  .basePath("/v1/api")
  .route("/auth", auth)
  .route("/storage", storage)

export type AppType = typeof app;

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
