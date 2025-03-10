import { eq, sql } from "drizzle-orm";
import { apiKeys } from "../db/schema/auth";
import { signJWT } from "@lib/jwt";
import { authRepository } from "@repositories/auth";
import { DB } from "@middleware/db";

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
const retrieveApiKey = async (db: DB, key: string) => {
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
  db: DB,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  unitId: string
) => {
  const { createUser, createIdentity, createSession, createRefreshToken } =
    authRepository;

  const newUser = await createUser(db, {
    email,
    encryptedPassword: password,
    firstName,
    lastName,
    unitId,
    lastSignedInAt: new Date(),
  });

  await createIdentity(db, newUser.id, "emailpass");

  const session = await createSession(db, newUser.id);

  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + 1000 * 60 * 15); // 15 minutes
  const token = await signJWT({
    userId: newUser.id,
    sessionId: session.id,
    exp: expiresAt,
    iat: new Date(),
  });
  const refreshToken = await createRefreshToken(db, newUser.id, session.id);

  return { token, refreshToken };
};

export const authService = {
  createUserWithPassword,
  retrieveApiKey,
};
