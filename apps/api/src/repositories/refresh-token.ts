import { refreshTokens } from "@db/schema/auth";
import { signJWT } from "@lib/jwt";
import type { DB } from "@middleware/db";
import { COMMON_HEADERS } from "@src/config/common-headers";
import { HTTP_CODES } from "@src/config/http-codes";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

/**
 * Creates a refresh token for a user session and stores it in the database.
 * The token expires after 30 days from creation.
 *
 * @param db - Database instance for storing the refresh token
 * @param userId - Unique identifier of the user
 * @param sessionId - Unique identifier of the user's session
 * @returns Promise containing the created refresh token string
 * @throws HTTPException with status 501 if token creation fails
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
    console.error(`Failed to create refresh token: ${e}`);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to create refresh token",
        }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
      ),
    });
  }
};

/**
 * Retrieves a refresh token from the database
 * @param db - The database instance
 * @param token - The refresh token string to search for
 * @returns A promise that resolves to the found refresh token record or null if not found
 */
const getRefreshToken = async (db: DB, token: string) => {
  return await db.query.refreshTokens.findFirst({
    where: (fields) => sql`${fields.token} = ${token}`,
  });
};

/**
 * Revokes a refresh token by setting its 'revoked' status to true in the database
 * @param db - The database connection instance
 * @param token - The refresh token string to be revoked
 * @throws {HTTPException} - Throws 501 error if token revocation fails
 */
const revokeRefreshToken = async (db: DB, token: string) => {
  try {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, token));
  } catch (e) {
    console.error(`Failed to revoke refresh token: ${e}`);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to revoke refresh token",
        }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
      ),
    });
  }
};

export const refreshTokenRepository = {
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
};
