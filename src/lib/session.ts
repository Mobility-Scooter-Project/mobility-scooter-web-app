import { sessionRepository } from "@repositories/session";
import { signJWT } from "./jwt";
import { DB } from "@middleware/db";
import { refreshTokenRepository } from "@repositories/refresh-token";

/**
 * Creates a new session for a user with associated JWT token and refresh token
 * 
 * @param db - Database connection instance
 * @param user - User object containing either new or existing user information
 * @returns Object containing:
 *  - token: JWT token for authentication
 *  - refreshToken: Token used to refresh the JWT token
 * 
 * @remarks
 * The JWT token expires after 15 minutes from creation
 * 
 * @throws Error if unable to create session, sign JWT, or create refresh token
 */
export const createSession = async (db: DB, userId: string) => {
  const session = await sessionRepository.createSession(db, userId);

  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + 1000 * 60 * 15); // 15 minutes

  const token = await signJWT({
    userId: userId,
    sessionId: session.id,
    exp: expiresAt,
    iat: new Date(),
  });

  const refreshToken = await refreshTokenRepository.createRefreshToken(
    db,
    userId,
    session.id
  );

  return { token, refreshToken };
};
