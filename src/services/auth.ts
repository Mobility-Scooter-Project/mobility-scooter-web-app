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

/**
 * Creates a new user with email/password authentication and returns a session
 * 
 * @param db - Database connection instance
 * @param email - User's email address
 * @param password - User's password (pre-encryption)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param unitId - Associated unit identifier
 * 
 * @returns Promise resolving to a user session
 * 
 * @remarks
 * This function will:
 * 1. Check if user exists by email
 * 2. Create new user if doesn't exist
 * 3. Ensure email/password identity exists
 * 4. Create and return a new session
 * 
 * @throws May throw database errors during user/identity creation or lookup
 */
export const createUserWithPassword = async (
  db: DB,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  unitId: string
) => {

    const {id} = await userRepository.createUser(db, {
      email,
      encryptedPassword: password,
      firstName,
      lastName,
      unitId,
      lastSignedInAt: new Date(),
    });
  

  return await createSession(db, id);
};

/**
 * Authenticates a user with their email and password, creating a new session if successful.
 * 
 * @param db - The database instance
 * @param email - The user's email address
 * @param password - The user's password
 * @returns A Promise that resolves to the created session
 * @throws {HTTPException} With status 401 if the email or password is invalid
 */
const signInWithPassword = async (db: DB, email: string, password: string) => {
  const user = await userRepository.findUserWithPassword(db, email, password);
  if (!user) {
    throw new HTTPException(401, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid email or password" })
      ),
    });
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`SET SESSION app.user_id = '${user.id}'`));
    await tx.execute(sql`SET ROLE authenticated_user`);
  });

  return await createSession(db, user.id);
};

export const authService = {
  createUserWithPassword,
  signInWithPassword,
  retrieveApiKey,
};
