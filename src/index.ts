import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { validateApiKey } from "./middleware/validate-api-key";

export const app = new Hono()
  .use(logger())
  .use(validateApiKey)
  .get("/healthcheck", (c) => {
    return new Response("OK", { status: 200 });
  });

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
