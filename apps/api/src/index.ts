import storage from "@handlers/storage";
import { serve } from "@hono/node-server";
import type { DB } from "@middleware/db";
import { apiReference } from "@scalar/hono-api-reference";
import auth from "@src/handlers/auth";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import { error } from "console";
import { HTTPException } from "hono/http-exception";

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
  .basePath("/api/v1")
  .route("/auth", auth)
  .route("/storage", storage);


app.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err);
    return err.getResponse();
  }

  return c.json({
    error: "Internal Server Error",
    data: null,
  }, 500);
});

app.notFound((c) => {
  return c.json({
    error: "Method or Route Not Found",
    data: null,
  }, 404);
}
);

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "MSWA API",
        version: "1.0.0",
        description: "Mobility Scooter Web Application API",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  }),
);

app.get(
  "/docs",
  apiReference({
    theme: "elysiajs",
    // @ts-expect-error - This is a valid configuration
    spec: { url: "/api/v1/openapi" },
  }),
);

export type AppType = typeof app;

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
