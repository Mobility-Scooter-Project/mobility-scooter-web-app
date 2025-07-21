import { zValidator } from "@hono/zod-validator";
import { HTTP_CODES } from "@src/config/http-codes";
import type { Variables } from "@src/index";
import container from "@src/lib/container";
import { generateQRCode } from "@src/lib/qr";
import { dbMiddleware } from "@src/middleware/db";
import { otpRateLimiter } from "@src/middleware/rate-limit";
import { userMiddleware } from "@src/middleware/user";
import { OtpService } from "@src/services/auth/otp";
import { OTPResponseSchema, verifyTOTPSchema } from "@src/validators/auth";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono<{ Variables: Variables }>()
  .get(
    "/",
    describeRoute({
      summary: "Generate a new TOTP secret and QR code",
      description: "Generate a new TOTP secret and QR code for a user",
      tags: ["auth"],
      responses: {
        200: {
          description: "TOTP secret and QR code generated successfully",
          content: {
            "application/json": {
              schema: resolver(OTPResponseSchema),
            },
          },
        },
      },
    }),
    userMiddleware,
    dbMiddleware,
    async (c) => {
      const otpService = c.get("container").get(OtpService);

      const userId = c.get("userId")!;
      const db = c.get("db");

      const totp = await otpService.generateOTP(db, userId);
      const qrCode = await generateQRCode(totp.toString());

      return c.json({
        data: {
          secret: totp.secret.base32,
          qrCode: qrCode.toString("base64"),
        },
        error: null,
      });
    },
  )
  .post(
    "/verify",
    describeRoute({
      summary: "Verify a TOTP token",
      description: "Verify a TOTP token for a user",
      tags: ["auth"],
      requestBody: {
        content: {
          "application/json": {
            schema: resolver(verifyTOTPSchema),
          },
        },
      },
      responses: {
        200: {
          description: "TOTP token verified successfully",
        },
      },
    }),
    userMiddleware,
    otpRateLimiter,
    dbMiddleware,
    zValidator("json", verifyTOTPSchema),
    async (c) => {
      const otpService = c.get("container").get(OtpService);
      
      const userId = c.get("userId")!;
      const db = c.get("db");

      const { token } = c.req.valid("json");

      const response = await otpService.verifyUserTOTP(db, userId, token);

      const valid = response === null ? false : response === -1 ? false : true;

      valid ? c.status(HTTP_CODES.OK) : c.status(HTTP_CODES.UNAUTHORIZED);
      return valid ? c.text("OK") : c.text("Invalid token");
    },
  );

export default app;
