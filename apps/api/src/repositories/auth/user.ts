import { identities, users } from "@shared/db/schema/auth";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { eq, sql, and } from "drizzle-orm";

type NewUser = typeof users.$inferInsert;

/**
 * Creates a new user in the database with encrypted password and associated identity.
 *
 * @param db - The database instance to perform the transaction
 * @param newUser - The new user data to be inserted
 * @returns Promise containing the created user's ID
 * @throws {HTTPException}
 *  - 409 if user already exists (duplicate entry)
 *  - 501 if user creation fails for other reasons
 *
 * @remarks
 * This function:
 * 1. Encrypts the password if provided
 * 2. Creates user record within a transaction
 * 3. Sets session user_id and role
 * 4. Creates an "emailpass" identity for the user if none exists
 */
const createUser = async (db: DB, newUser: NewUser) => {
  const encryptedPassword = newUser.encryptedPassword
    ? sql`crypt(${newUser.encryptedPassword}, gen_salt('bf'))`
    : null;
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .insert(users)
        .values({
          ...newUser,
          encryptedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: users.id });

      await tx.execute(sql.raw(`SET SESSION app.user_id = '${data[0].id}'`));
      await tx.execute(sql`SET ROLE authenticated_user`);

      const identity = await tx
        .select()
        .from(identities)
        .where(eq(identities.userId, data[0].id));

      if (!identity[0]) {
        await tx.insert(identities).values({
          userId: data[0].id,
          provider: "emailpass",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return data;
    });
    return data[0];
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "23505"
    ) {
      throw new HTTPError(
        HTTP_CODES.CONFLICT,
        "User already exists",
      );
    }

    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to create user",
    );
  }
};


/**
 * Finds a user by their email address in the database.
 * @param db - The database instance to query
 * @param email - The email address to search for
 * @returns The first user found with the matching email address
 * @throws {HTTPError} When the database query fails with HTTP 500 Internal Server Error
 */
export const findUserByEmail = async (db: DB, email: string) => {
  try {
    const data = await db.select().from(users).where(eq(users.email, email));
    return data[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to find user by email",
    );
  }
};

/**
 * Finds a user by their email address and verifies the password.
 * 
 * @param db - The database instance to query
 * @param email - The email address to search for
 * @param password - The password to verify
 * @returns The first user found with the matching email address and password
 * @throws {HTTPError} When the database query fails with HTTP 500 Internal Server Error
 */
export const findUserWithPassword = async (
  db: DB,
  email: string,
  password: string,
) => {
  try {
    const data = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(
            users.encryptedPassword,
            sql`crypt(${password}, ${users.encryptedPassword})`,
          ),
        ),
      );
    return data[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to find user with password",
    );
  }
};


/**
 * Retrieves a user from the database by their unique identifier
 * @param db - The database connection instance
 * @param id - The unique identifier of the user to find
 * @returns The user object if found, undefined otherwise
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const findUserById = async (db: DB, id: string) => {
  try {
    const data = await db.select().from(users).where(eq(users.id, id));
    return data[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to find user by ID",
    );
  }
};


/**
 * Updates the password for a specified user in the database
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @param password - The new password in plain text
 * @throws {HTTPError} When the password update fails with status code 500
 */
const updatePassword = async (db: DB, userId: string, password: string) => {
  const encryptedPassword = sql`crypt(${password}, gen_salt('bf'))`;
  try {
    await db.update(users).set({ encryptedPassword }).where(eq(users.id, userId));
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update password",
    );
  }
};

export const userRepository = {
  createUser,
  findUserByEmail,
  findUserWithPassword,
  findUserById,
  updatePassword,
};
