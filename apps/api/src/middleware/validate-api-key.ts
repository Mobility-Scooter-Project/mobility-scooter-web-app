import { HTTP_CODES } from "@src/config/http-codes";
import { apiKeyRepository } from "@src/repositories/api-keys";
import { apiKeyService } from "@src/services/auth/api-key";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "./db";
import { COMMON_HEADERS } from "@src/config/common-headers";
import { HTTPError } from "@src/lib/errors";

/**
 * Middleware function to validate API key from Authorization header
 * @param c - The Context object containing request information
 * @param next - The Next function to be called if validation succeeds
 * @throws {HTTPException} With status 401 if Authorization header is missing or API key is invalid
 */
export const validateApiKey = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Authorization header is missing",
    );
  }

  const [, apiKey] = authHeader.split("Bearer ");
  const result = await apiKeyService.retrieveApiKey(db, apiKey);

  if (!result) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid API key",
    );
  }

  await apiKeyRepository.bumpLastUsed(apiKey);

  await next();
};
