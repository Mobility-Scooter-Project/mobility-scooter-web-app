import { identities } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";


/**
 * Retrieves an identity record from the database based on the user ID.
 * @param db - The database connection instance
 * @param userId - The unique identifier of the user
 * @returns A Promise that resolves to the first matching identity record
 * @throws {HTTPException} With status 501 if the database query fails
 */
const getIdentityByUserId = async (db: DB, userId: string) => {
  try {
    const data = await db
      .select()
      .from(identities)
      .where(sql`user_id = ${userId}`);

    return data[0];
  } catch (e) {
    console.error(`Failed to get identity by user id: ${e}`);
    throw new HTTPException(501, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to get identity",
        })
      ),
    });
  }
};

export const identityRepository = {
  getIdentityByUserId,
};
