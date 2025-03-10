import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

export const app = new Hono().use(logger()).get("/healthcheck", (c) => {
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
