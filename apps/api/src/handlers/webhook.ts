import { Hono } from "hono";
import { Variables } from "..";
import { dbMiddleware } from "@src/middleware/db";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { webhookService } from "@src/services/webhook";

const app = new Hono<{ Variables: Variables }>().post("/storage/videos", dbMiddleware, async (c) => {
    await webhookService.putVideo(await c.req.json());
    return c.status(200);
});

export default app;