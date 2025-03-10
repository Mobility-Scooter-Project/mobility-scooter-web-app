import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { apiKeys, identities, users } from "../db/schema/auth";
import { HTTPException } from "hono/http-exception";
import { providers } from "@db/schema/auth";

type NewUser = typeof users.$inferInsert;

/**
 * Retrieves and validates an API key from the database
 * @param key - The API key to validate
 * @returns Promise that resolves to a boolean indicating whether the key exists and is active
 * @example
 * ```typescript
 * const isValid = await retrieveApiKey('some-api-key');
 * if (isValid) {
 *   // API key is valid and active
 * }
 * ```
 */
export const retrieveApiKey = async (key: string) => {
  const data = await db.query.apiKeys.findFirst({
    where: (fields) =>
      sql`${fields.encryptedKey} = crypt(${key}, ${fields.encryptedKey}) and ${
        fields.isActive
      } = ${true}`,
  });
  if (data && data.isActive) {
    try {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, data.id));
    } catch (e) {
      console.error(`Failed to update API key: ${e}`);
    }
    return true;
  }
  return false;
};

export const createUser = async (newUser: NewUser) => {
  try {
    const data = await db
      .insert(users)
      .values(newUser)
      .returning({ id: users.id });
    return data[0];
  } catch (e) {
    console.error(`Failed to create user: ${e}`);
    throw new HTTPException(501, { message: "Failed to create user" });
  }
};

export const createIdentity = async (
  userId: string,
  provider: (typeof providers.enumValues)[0]
) => {
  try {
    const data = await db
      .insert(identities)
      .values({
        id: crypto.randomUUID(),
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
