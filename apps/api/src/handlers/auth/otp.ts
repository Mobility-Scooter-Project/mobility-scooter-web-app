import { zValidator } from "@hono/zod-validator";
import { Variables } from "@src/index";
import { generateQRCode } from "@src/lib/qr";
import { dbMiddleware } from "@src/middleware/db";
import { otpRateLimiter } from "@src/middleware/rate-limit";
import { userMiddleware } from "@src/middleware/user";
import { validateApiKey } from "@src/middleware/validate-api-key";
import { authService } from "@src/services/auth";
import { verifyTOTPSchema } from "@src/validators/auth";
import { Hono } from "hono";

const app = new Hono<{ Variables: Variables }>().get("/", validateApiKey, userMiddleware, dbMiddleware, async (c) => {
    const userId = c.get("userId")!;
    const db = c.get("db");

    const totp = await authService.generateOTP(db, userId)
    const qrCode = await generateQRCode(totp.toString());

    return c.json({
        data: {
            secret: totp.secret.base32,
            qrCode: qrCode.toString("base64"),
        },
        error: null,
    })
}).post("/verify", validateApiKey, userMiddleware, otpRateLimiter, dbMiddleware, zValidator("json", verifyTOTPSchema), async (c) => {
    const userId = c.get("userId")!;
    const db = c.get("db");

    const { token } = c.req.valid("json");

    const response = await authService.verifyUserTOTP(db, userId, token);

    const valid = response === null ? false : response === -1 ? false : true;

    valid ? c.status(200) : c.status(401);
    return valid ? c.text("OK") : c.text("Invalid token");
});

export default app;