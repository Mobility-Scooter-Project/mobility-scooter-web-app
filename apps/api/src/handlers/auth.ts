import { zValidator } from "@hono/zod-validator";
import { db, dbMiddleware } from "@middleware/db";
import { validateApiKey } from "@middleware/validate-api-key";
import { authService } from "@services/auth";
import { Hono } from "hono";
import { Variables } from "src";
import {
  createUserWithPasswordSchema,
  refreshTokenSchema,
  signInWithPasswordSchema,
  verifyTOTPSchema,
} from "@validators/auth";
import { signInRateLimiter, signUpRateLimiter } from "@src/middleware/rate-limit";
import { userMiddleware } from "@src/middleware/user";
import { generateQRCode } from "@src/lib/qr";
import { verifyTOTP } from "@src/lib/otp";

const app = new Hono<{ Variables: Variables }>()
  .post(
    "/emailpass/register",
    validateApiKey,
    dbMiddleware,
    signUpRateLimiter,
    zValidator("json", createUserWithPasswordSchema),
    async (c) => {
      const { email, password, firstName, lastName, unitId } =
        c.req.valid("json");
      const db = c.get("db");

      const { token, refreshToken } = await authService.createUserWithPassword(
        db,
        email,
        password,
        firstName,
        lastName,
        unitId
      );

      return c.json({
        data: {
          token,
          refreshToken,
        },
        error: null,
      });
    }
  )
  .post(
    "/emailpass",
    validateApiKey,
    dbMiddleware,
    zValidator("json", signInWithPasswordSchema),
    signInRateLimiter,
    async (c) => {
      const { email, password } = c.req.valid("json");
      const db = c.get("db");

      const { token, refreshToken } = await authService.signInWithPassword(
        db,
        email,
        password
      );

      return c.json({
        data: {
          token,
          refreshToken,
        },
        error: null,
      });
    }
  )
  .post(
    "/refresh",
    dbMiddleware,
    validateApiKey,
    zValidator("json", refreshTokenSchema),
    async (c) => {
      const { token } = c.req.valid("json");

      const { token: newToken, refreshToken } = await authService.refreshToken(
        db,
        token
      );

      c.json({
        data: {
          token: newToken,
          refreshToken,
        },
        error: null,
      });
    }
  ).get("/otp", validateApiKey, userMiddleware, dbMiddleware, async (c) => {
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
  }).post("/otp/validate", validateApiKey, userMiddleware, dbMiddleware, zValidator("json", verifyTOTPSchema), async (c) => {
    const userId = c.get("userId")!;
    const db = c.get("db");

    const { token, secret } = c.req.valid("json");

    const response = await authService.verifyUserTOTP(db, userId, token, secret);

    const valid = response === null ? false: response === -1 ? false : true;

    return c.json({
      data: {
        valid 
      },
      error: null,
    })
  });

export default app;
