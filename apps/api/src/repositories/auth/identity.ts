import { identities } from "@shared/db/schema/auth";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { sql } from "drizzle-orm";

/**
 * Retrieves an identity record from the database based on the user ID.
 * 
 * @param db - The database connection instance
 * @param userId - The unique identifier of the user
 * @returns A Promise that resolves to the first matching identity record
 * @throws {HTTPError} With status 500 if the database query fails
 */
const getIdentityByUserId = async (db: DB, userId: string) => {
  try {
    const data = await db
      .select()
      .from(identities)
      .where(sql`user_id = ${userId}`);

    return data[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to get identity",
    );
  }
};

export const identityRepository = {
  getIdentityByUserId,
};
