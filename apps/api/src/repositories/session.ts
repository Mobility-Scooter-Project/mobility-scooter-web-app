import { sessions } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { HTTPException } from "hono/http-exception";

/**
 * Creates a new session for a user in the database.
 * 
 * @param db - The database instance
 * @param userId - The ID of the user to create a session for
 * @returns The newly created session object
 * @throws {HTTPException} With status 501 if session creation fails
 */
const createSession = async (db: DB, userId: string) => {
  try {
    const data = await db.insert(sessions).values({ userId }).returning();
    return data[0];
  } catch (e) {
    console.error(`Failed to create session: ${e}`);
    throw new HTTPException(501, { message: "Failed to create session" });
  }
};

export const sessionRepository = {
  createSession,
};
