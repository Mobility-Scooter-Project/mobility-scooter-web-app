import { COMMON_HEADERS } from "@src/config/common-headers";
import { HTTP_CODES } from "@src/config/http-codes";
import { apiKeys } from "@src/db/schema/auth";
import { db } from "@src/middleware/db";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

/**
 * Updates the "lastUsedAt" timestamp for an API key in the database.
 *
 * This function marks the API key as recently used by updating its
 * lastUsedAt field to the current date and time.
 *
 * @param apiKey - The plain text API key to update
 * @throws {HTTPException} With status 500 if the database update fails
 */
const bumpLastUsed = async (apiKey: string) => {
  const lastUsedAt = new Date();

  try {
    await db
      .update(apiKeys)
      .set({ lastUsedAt })
      .where(
        eq(
          apiKeys.encryptedKey,
          sql`crypt(${apiKey}, ${apiKeys.encryptedKey})`,
        ),
      );
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({ data: null, error: "Failed to update last used timestamp" }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON},
      ),
    });
  }
};

export const apiKeyRepository = {
  bumpLastUsed,
};
