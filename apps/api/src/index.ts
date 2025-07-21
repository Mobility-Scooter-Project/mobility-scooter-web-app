import storage from "@handlers/storage";
import { serve } from "@hono/node-server";
import type { DB } from "@middleware/db";
import { apiReference } from "@scalar/hono-api-reference";
import auth from "@src/handlers/auth";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { PinoLogger, pinoLogger } from 'hono-pino'
import { prometheus } from '@hono/prometheus'
import { HTTPError } from "./lib/errors";
import logger from "./lib/logger"
import container from "./lib/container";
import { diMiddleware } from "./middleware/di";

const startTime = Date.now();
logger.info("Starting API server...");


export type Variables = {
  db: DB;
  userId?: string;
  sessionId?: string;
  logger: PinoLogger;
  container: typeof container;
};

const { printMetrics, registerMetrics } = prometheus()

export const app = new Hono<{ Variables: Variables }>()
  .use(diMiddleware)
  .use(pinoLogger({
    pino: logger,
  }))
  .use('*', registerMetrics)
  .get("/metrics", printMetrics)
  .get("/healthcheck", (c) => {
    return c.text("OK");
  })
  .get(
    "/docs",
    apiReference({
      theme: "elysiajs",
      spec: { url: "/api/v1/openapi" },
    }),
  )
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

export type AppType = typeof app;

const endTime = Date.now();
logger.info(`API server started in ${endTime - startTime}ms`);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
    logger.info(`API Docs: http://localhost:${info.port}/docs`);
    logger.info(`OpenAPI Spec: http://localhost:${info.port}/api/v1/openapi`);
  },
);