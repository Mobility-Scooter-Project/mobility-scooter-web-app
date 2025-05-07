import type { DB } from "@middleware/db";
import { postgresDB } from "@middleware/db";
import { refreshTokenRepository } from "@src/repositories/auth/refresh-token";
import { userRepository } from "@src/repositories/auth/user";
import { BASE_URL, JWT_SECRET } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { sendEmail } from "@src/integrations/smtp";
import { sql } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { sessionService } from "./session";
import { vault } from "@src/integrations/vault";
import { HTTPError } from "@src/lib/errors";
import { ENVIRONMENT } from "@src/config/constants";

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
 * 1. Create new user if doesn't exist
 * 2. Ensure email/password identity exists
 * 3. Create and return a new session
 *
 * @throws May throw database errors during user/identity creation or lookup
 */
export const createUserWithPassword = async (
  db: DB,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  unitId: string,
) => {
  const { id } = await userRepository.createUser(db, {
    email,
    encryptedPassword: password,
    firstName,
    lastName,
    unitId,
    lastSignedInAt: new Date(),
  });

  return await sessionService.createSession(db, id);
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
  let user;
  try {
    user = await userRepository.findUserWithPassword(db, email, password);
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to find user",
    );
  }

  if (!user) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid email or password",
    )
  }

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SET SESSION app.user_id = '${user.id}'`));
      await tx.execute(sql`SET ROLE authenticated_user`);
    });
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to set session user",
    );
  }

  return await sessionService.createSession(db, user.id);
};

/**
 * Refreshes an authentication session using a refresh token.
 *
 * @param db - Database connection instance
 * @param refreshToken - The refresh token string to validate
 * @returns A Promise resolving to a new session with fresh access and refresh tokens
 * @throws {HTTPException} With status 401 if the refresh token is invalid, revoked, or expired
 */
const refreshToken = async (db: DB, refreshToken: string) => {
  const record = await refreshTokenRepository.getRefreshToken(db, refreshToken);

  if (
    !record ||
    record.revoked ||
    !record.expiresAt ||
    record.expiresAt < new Date()
  ) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid refresh token",
    );
  }

  await refreshTokenRepository.revokeRefreshToken(db, refreshToken);

  return await sessionService.createSession(db, record.userId);
};

/**
 * Generates a reset password token for a user.
 *
 * @param email - The email address of the user requesting a password reset
 * @returns {Promise<string|undefined>} In non-production environments, returns the generated token. In production, returns undefined.
 * @throws {HTTPException} With status 404 if the user is not found
 *
 * This function:
 * 1. Finds the user by email
 * 2. Creates a JWT payload with user ID and 24-hour expiration
 * 3. Signs the token with JWT_SECRET
 * 4. Persists the token in the database
 * 5. In production, emails the reset link to the user
 * 6. In non-production environments, returns the token
 */
const generateResetPasswordToken = async (email: string) => {
  let data;
  try {
    data = await userRepository.findUserByEmail(postgresDB, email);
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to find user",
    );
  }

  if (!data) {
    throw new HTTPError(
      HTTP_CODES.NOT_FOUND,
      "User not found",
    );
  }

  const { id } = data;

  const payload = { userId: id, exp: Date.now() + 1000 * 60 * 60 * 24 };

  let token;
  try {
    token = await sign(payload, JWT_SECRET);
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to sign JWT",
    );
  }

  await vault.createPasswordResetToken(token, id);

  if (ENVIRONMENT === "production") {
    try {
      await sendEmail(
        email,
        "MSB Password Reset",
        "no-reply@example.com",
        `Click here to reset your password: ${BASE_URL}/reset-password?token=${token}`,
      );
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to send email",
      );
    }
  } else {
    return token;
  }
};

/**
 * Resets a user's password using a verification token.
 *
 * @param token - The JWT token used to verify the password reset request
 * @param password - The new password to set for the user
 *
 * @throws {HTTPException} 401 - If the token is invalid or expired
 * @throws {HTTPException} 501 - If updating the password in the database fails
 *
 * @remarks
 * This function performs the following steps:
 * 1. Verifies the provided token
 * 2. Extracts the userId from the token payload
 * 3. Marks the password reset token as used
 * 4. Updates the user's password in the database
 */
const resetPassword = async (token: string, password: string) => {
  let payload;
  try {
    payload = await verify(token, JWT_SECRET);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.UNAUTHORIZED,
      e,
      "Invalid token",
    );
  }

  const { userId } = payload as { userId: string };

  await vault.markPasswordResetTokenUsed(token, userId);
  try {
    await userRepository.updatePassword(postgresDB, userId, password);
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update password",
    );
  }
};

export const authService = {
  createUserWithPassword,
  signInWithPassword,
  refreshToken,
  generateResetPasswordToken,
  resetPassword,
};
