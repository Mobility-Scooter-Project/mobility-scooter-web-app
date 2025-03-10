import { eq, sql } from "drizzle-orm";
import { apiKeys } from "../db/schema/auth";
import { DB } from "@middleware/db";
import { ExistingUser, NewUser, userRepository } from "@repositories/user";
import { identityRepository } from "@repositories/identity";
import { createSession } from "@lib/session";
import { HTTPException } from "hono/http-exception";

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
  let user: NewUser | ExistingUser;
  user = await userRepository.findUserByEmail(db, email);

  if (!user) {
    user = await userRepository.createUser(db, {
      email,
      encryptedPassword: password,
      firstName,
      lastName,
      unitId,
      lastSignedInAt: new Date(),
    });
  }

  let identity = await identityRepository.getIdentityByUserId(db, user.id!);

  if (!identity || identity.provider !== "emailpass") {
    identity = await identityRepository.createIdentity(
      db,
      user.id!,
      "emailpass"
    );
  }

  return await createSession(db, user);
};

const signInWithPassword = async (db: DB, email: string, password: string) => {
  const user = await userRepository.findUserWithPassword(db, email, password);
  if (!user) {
    throw new HTTPException(401, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid email or password" })
      ),
    });
  }

  return await createSession(db, user);
};

export const authService = {
  createUserWithPassword,
  signInWithPassword,
  retrieveApiKey,
};
