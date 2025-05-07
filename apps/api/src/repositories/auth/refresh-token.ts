import { refreshTokens } from "@src/db/schema/auth";
import { signJWT } from "@lib/jwt";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { eq, sql } from "drizzle-orm";

/**
 * Creates a refresh token for a user session
 * 
 * @param db - Database instance for performing operations
 * @param userId - Unique identifier of the user
 * @param sessionId - Unique identifier of the session
 * @returns Promise containing the generated refresh token string
 * @throws {HTTPError} When token creation fails with HTTP 500 Internal Server Error
 *
 * @remarks
 * The refresh token expires in 30 days from creation
 */
const createRefreshToken = async (
  db: DB,
  userId: string,
  sessionId: string,
) => {
  try {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const token = await signJWT({
      userId,
      sessionId,
      exp: expiresAt,
      iat: new Date(),
    });

    const data = await db
      .insert(refreshTokens)
      .values({ sessionId, token, userId, expiresAt })
      .returning();
    return data[0].token;
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to create refresh token",
    );
  }
};


/**
 * Retrieves a refresh token from the database
 * @param db - The database instance
 * @param token - The refresh token string to search for
 * @returns A promise that resolves to the refresh token record if found, or null if not found
 * @throws {HTTPError} With status 500 if the database query fails
 */
const getRefreshToken = async (db: DB, token: string) => {
  try {
    return await db.query.refreshTokens.findFirst({
      where: (fields) => sql`${fields.token} = ${token}`,
    });
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to get refresh token",
    );
  }
};


/**
 * Revokes a refresh token by setting its 'revoked' status to true in the database.
 * 
 * @param db - The database instance to perform the update operation
 * @param token - The refresh token string to be revoked
 * @throws {HTTPError} With status 500 if the database operation fails
 */
const revokeRefreshToken = async (db: DB, token: string) => {
  try {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, token));
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to revoke refresh token",
    );
  }
};

export const refreshTokenRepository = {
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
};
