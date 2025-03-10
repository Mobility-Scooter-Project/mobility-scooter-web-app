import { identities, providers } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const createIdentity = async (
  db: DB,
  userId: string,
  provider: (typeof providers.enumValues)[0]
) => {
  try {
    const data = await db
      .insert(identities)
      .values({
        userId,
        provider,
      })
      .returning();
    return data[0];
  } catch (e) {
    console.error(`Failed to create identity: ${e}`);
    throw new HTTPException(501, { message: "Failed to create identity" });
  }
};

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
  createIdentity,
  getIdentityByUserId,
};
