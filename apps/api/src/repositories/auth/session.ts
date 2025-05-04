import { sessions } from "@src/db/schema/auth";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";


/**
 * Creates a new session for a user in the database
 * @param db - The database instance
 * @param userId - The ID of the user to create a session for
 * @returns The created session record
 * @throws {HTTPError} When the session creation fails with a 500 Internal Server Error
 */
const createSession = async (db: DB, userId: string) => {
  try {
    const data = await db.insert(sessions).values({ userId }).returning();
    return data[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to create session",
    );
  }
};

export const sessionRepository = {
  createSession,
};
