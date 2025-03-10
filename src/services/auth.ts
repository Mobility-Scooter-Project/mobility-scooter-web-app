import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { apiKeys } from "../db/schema/auth";
import { createUser } from "src/repositories/auth";

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

export const createUserWithPassword = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  unitId: string
) => {
  const newUser = await createUser({
    email,
    encryptedPassword: password,
    firstName,
    lastName,
    unitId,
  });
};
