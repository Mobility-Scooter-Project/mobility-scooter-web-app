import { identities, users } from "@src/db/schema/auth";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { eq, sql, and, isNull, SQL } from "drizzle-orm";

type NewUser = typeof users.$inferInsert;
type UserColumnSelection = {
  id?: boolean;
  unitId?: boolean;
  permissions?: boolean;
  lastSignedInAt?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  firstName?: boolean;
  lastName?: boolean;
  title?: boolean;
  email?: boolean;
  city?: boolean;
  mobileNumber?: boolean;
  pfpUrl?: boolean;
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

    const fieldSet = fields ? new Set(fields) : null;

    const query: {
      where?: SQL;
      columns?: UserColumnSelection;
    } = {
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    };

    if (fieldSet) {
      query.columns = {
        id: fieldSet.has("id"),
        unitId: fieldSet.has("unitId"),
        permissions: fieldSet.has("permissions"),
        lastSignedInAt: fieldSet.has("lastSignedInAt"),
        createdAt: fieldSet.has("createdAt"),
        updatedAt: fieldSet.has("updatedAt"),
        deletedAt: fieldSet.has("deletedAt"),
        firstName: fieldSet.has("firstName"),
        lastName: fieldSet.has("lastName"),
        title: fieldSet.has("title"),
        email: fieldSet.has("email"),
        city: fieldSet.has("city"),
        mobileNumber: fieldSet.has("mobileNumber"),
        pfpUrl: fieldSet.has("pfpUrl"),
      };
    }

    const user = await db.query.users.findFirst(query);

    if (!user) {
      return {
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };
    }

    return {
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

export const usersRepository = {
  getUserById,
  softDeleteUser,
  updatePfp,
  removePfp,
  updateUser,
};
