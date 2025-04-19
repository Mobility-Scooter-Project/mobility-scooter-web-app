import storage from "@handlers/storage";
import { serve } from "@hono/node-server";
import type { DB } from "@middleware/db";
import { apiReference } from "@scalar/hono-api-reference";
import auth from "@src/handlers/auth";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { PinoLogger, pinoLogger } from 'hono-pino'
import { ENVIRONMENT } from "./config/constants";
import { prometheus } from '@hono/prometheus'
import { HTTPError } from "./lib/errors";

export type Variables = {
  db: DB;
  userId?: string;
  sessionId?: string;
  logger: PinoLogger;
};

const { printMetrics, registerMetrics } = prometheus()

export const app = new Hono<{ Variables: Variables }>()
  .use(pinoLogger({
    pino: {
      level: ENVIRONMENT === "test" ? "silent" : "info",
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: ENVIRONMENT === "development",
          sync: ENVIRONMENT === "test",
        }
      }
    }
  }))
  .use('*', registerMetrics)
  .get("/metrics", printMetrics)
  .get("/healthcheck", (c) => {
    return c.text("OK");
  })
  .basePath("/api/v1")
  .route("/auth", auth)
  .route("/storage", storage);


app.onError((err, c) => {
  const { logger } = c.var;
  if (err instanceof HTTPError) {
    logger.error(err.message);
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