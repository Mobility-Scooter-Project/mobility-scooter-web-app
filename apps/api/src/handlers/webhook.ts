import { Hono } from "hono";
import { Variables } from "..";
import { dbMiddleware } from "@src/middleware/db";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { webhookService } from "@src/services/webhook";

const app = new Hono<{ Variables: Variables }>().post("/storage/videos", dbMiddleware, async (c) => {
    await webhookService.putVideo(await c.req.json());
    return new Response(JSON.stringify({
        data: null,
        error: null
    }), { status: 200 });
});

export default app;