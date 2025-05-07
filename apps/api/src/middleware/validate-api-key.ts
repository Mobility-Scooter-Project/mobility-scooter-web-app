import { HTTP_CODES } from "@src/config/http-codes";
import { apiKeyRepository } from "@src/repositories/auth/api-keys";
import { apiKeyService } from "@src/services/auth/api-key";
import type { Context, Next } from "hono";
import { postgresDB } from "./db";
import { HTTPError } from "@src/lib/errors";


/**
 * Middleware that validates API key from the Authorization header
 * @param c - The Context object containing request information
 * @param next - The Next function to be called if validation succeeds
 * @throws {HTTPError} When Authorization header is missing or API key is invalid
 * @remarks
 * This middleware expects the API key to be provided in the Authorization header
 * using the Bearer scheme format. It validates the API key against the database
 * and updates the last used timestamp if valid.
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
  const result = await apiKeyService.retrieveApiKey(postgresDB, apiKey);

  if (!result) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid API key",
    );
  }

  await apiKeyRepository.bumpLastUsed(apiKey);

  await next();
};
