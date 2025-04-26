import { HTTP_CODES } from "@src/config/http-codes";
import { apiKeys } from "@shared/db/schema/auth";
import { HTTPError } from "@src/lib/errors";
import { postgresDB } from "@src/middleware/db";
import { eq, sql } from "drizzle-orm";

/**
 * Updates the 'lastUsedAt' timestamp for a given API key in the database.
 * 
 * @param apiKey - The plain text API key to update the timestamp for
 * @throws {HTTPError} If the database update operation fails with HTTP 500 status code
 * @returns {Promise<void>}
 */
const bumpLastUsed = async (apiKey: string) => {
  const lastUsedAt = new Date();

  try {
    await postgresDB
      .update(apiKeys)
      .set({ lastUsedAt })
      .where(
        eq(
          apiKeys.encryptedKey,
          sql`crypt(${apiKey}, ${apiKeys.encryptedKey})`,
        ),
      );
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update last used timestamp",
    );
  }
};

export const apiKeyRepository = {
  bumpLastUsed,
};
