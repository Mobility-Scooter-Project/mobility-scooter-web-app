import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import auth from "@src/handlers/auth";
import { DB } from "@middleware/db";
import storage from "@handlers/storage";

export type Variables = {
  db: DB;
  userId?: string;
  sessionId?: string;
};

export const app = new Hono<{ Variables: Variables }>()
  .use(logger())
  .get("/healthcheck", (c) => {
    return c.text("OK");
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
