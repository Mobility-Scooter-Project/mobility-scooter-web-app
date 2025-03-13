import { Hono } from "hono";
import { Variables } from "..";
import { dbMiddleware } from "@src/middleware/db";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { webhookService } from "@src/services/webhooks";

const app = new Hono<{ Variables: Variables }>().post("/storage/videos/", dbMiddleware, validateApiKey, async (c) => {
    await webhookService.processVideoUploadWebhook(await c.req.json());
});

export default app;