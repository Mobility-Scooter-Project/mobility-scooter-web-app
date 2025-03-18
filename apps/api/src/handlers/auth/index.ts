import { zValidator } from "@hono/zod-validator";
import { db, dbMiddleware } from "@middleware/db";
import { validateApiKey } from "@middleware/validate-api-key";
import { authService } from "@src/services/auth";
import { Hono } from "hono";
import { Variables } from "src";
import {
  refreshTokenSchema,
} from "@validators/auth";
import emailpass from "./emailpass";
import otp from "./otp";
import refresh from "./refresh";

const app = new Hono<{ Variables: Variables }>()
  .route("/emailpass", emailpass)
  .route("/refresh", refresh)
  .route("/otp", otp)

export default app;
