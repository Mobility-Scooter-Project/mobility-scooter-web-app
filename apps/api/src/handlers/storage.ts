import { Hono } from "hono";
import { Variables } from "..";
import { dbMiddleware } from "@src/middleware/db";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { userMiddleware } from "@src/middleware/user"; // TODO: Add user middleware
import { zValidator } from "@hono/zod-validator";
import { presignedUrlSchema } from "@src/validators/storage";
import { storageService } from "@src/services/storage";

const app = new Hono<{ Variables: Variables }>().post('/videos/presigned-url', userMiddleware, dbMiddleware, validateApiKey, zValidator("json", presignedUrlSchema), async (c) => {
    const { filename, patientId, date } = c.req.valid("json")
    const userId = c.get("userId")!;

    const url = await storageService.generatePresignedVideoPutUrl(filename, userId, patientId, date);
    return new Response(JSON.stringify({
        data: {
            url
        },
        error: null
    }), { status: 200, headers: { "Content-Type": "application/json" } });
});

export default app;