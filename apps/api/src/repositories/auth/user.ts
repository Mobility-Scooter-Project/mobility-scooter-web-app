import { identities, users } from "@src/db/schema/auth";
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
      throw new HTTPError(HTTP_CODES.CONFLICT, "User already exists");
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
    await db
      .update(users)
      .set({ encryptedPassword })
      .where(eq(users.id, userId));
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update password",
    );
  }
};

/**
 * Retrieves a user by ID with optional field selection
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @param fields - Optional array of fields to select
 * @returns The user object if found, undefined otherwise
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const getUserById = async (db: DB, userId: string, fields?: string[]) => {
  try {
    if (!userId) {
      return {
        status: 400,
        data: null,
        error: {
          code: "BAD_REQUEST",
          message: "User ID is required",
        },
      };
    }

    const user = await db.query.users.findFirst({
      where: (u: any, { eq, and, isNull }: any) =>
        and(eq(u.id, userId), isNull(u.deletedAt)),
      columns: fields
        ? {
            id: fields.includes("id"),
            unitId: fields.includes("unitId"),
            permissions: fields.includes("permissions"),
            lastSignedInAt: fields.includes("lastSignedInAt"),
            createdAt: fields.includes("createdAt"),
            updatedAt: fields.includes("updatedAt"),
            deletedAt: fields.includes("deletedAt"),
            firstName: fields.includes("firstName"),
            lastName: fields.includes("lastName"),
            title: fields.includes("title"),
            email: fields.includes("email"),
            city: fields.includes("city"),
            mobileNumber: fields.includes("mobileNumber"),
            pfpUrl: fields.includes("pfpUrl"),
          }
        : {
            id: true,
            unitId: true,
            permissions: true,
            lastSignedInAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            firstName: true,
            lastName: true,
            title: true,
            email: true,
            city: true,
            mobileNumber: true,
            pfpUrl: true,
          },
    });

    if (!user) {
      return {
        status: 404,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      status: 200,
      data: user,
      error: null,
    };
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to retrieve user",
    );
  }
};

/**
 * Updates a user's profile information
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @param updateData - The data to update
 * @returns The updated user object
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const updateUser = async (
  db: DB,
  userId: string,
  updateData: Partial<NewUser>,
) => {
  try {
    const result = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`deleted_at IS NULL`))
      .returning({
        id: users.id,
        unitId: users.unitId,
        permissions: users.permissions,
        lastSignedInAt: users.lastSignedInAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deletedAt: users.deletedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        title: users.title,
        email: users.email,
        city: users.city,
        mobileNumber: users.mobileNumber,
        pfpUrl: users.pfpUrl,
      });

    if (result.length === 0) {
      return {
        status: 404,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      status: 200,
      data: result[0],
      error: null,
    };
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update user",
    );
  }
};

/**
 * Soft deletes a user by setting the deletedAt timestamp
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @returns Success response
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const softDeleteUser = async (db: DB, userId: string) => {
  try {
    const result = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`deleted_at IS NULL`))
      .returning({ id: users.id });

    if (result.length === 0) {
      return {
        status: 404,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      status: 200,
      data: { success: true },
      error: null,
    };
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to delete user",
    );
  }
};

/**
 * Updates a user's profile picture URL
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @param pfpUrl - The new profile picture URL
 * @returns The updated user object
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const updatePfp = async (db: DB, userId: string, pfpUrl: string) => {
  try {
    const result = await db
      .update(users)
      .set({
        pfpUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`deleted_at IS NULL`))
      .returning({
        id: users.id,
        pfpUrl: users.pfpUrl,
      });

    if (result.length === 0) {
      return {
        status: 404,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      status: 200,
      data: result[0],
      error: null,
    };
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update profile picture",
    );
  }
};

/**
 * Removes a user's profile picture by setting pfpUrl to null
 * @param db - The database instance
 * @param userId - The unique identifier of the user
 * @returns Success response
 * @throws {HTTPError} When database operation fails with HTTP 500 status code
 */
const removePfp = async (db: DB, userId: string) => {
  try {
    const result = await db
      .update(users)
      .set({
        pfpUrl: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`deleted_at IS NULL`))
      .returning({ id: users.id });

    if (result.length === 0) {
      return {
        status: 404,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
      status: 200,
      data: { success: true },
      error: null,
    };
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to remove profile picture",
    );
  }
};

export const userRepository = {
  createUser,
  findUserByEmail,
  findUserWithPassword,
  findUserById,
  updatePassword,
  getUserById,
  updateUser,
  softDeleteUser,
  updatePfp,
  removePfp,
};
