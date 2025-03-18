import { eq, sql } from "drizzle-orm";
import { apiKeys } from "../db/schema/auth";
import { db, DB } from "@middleware/db";
import { userRepository } from "@repositories/user";
import { createSession } from "@lib/session";
import { HTTPException } from "hono/http-exception";
import { refreshTokenRepository } from "@repositories/refresh-token";
import { generateTOTP, verifyTOTP } from "@src/lib/otp";
import { createOtpSecret, getOtpSecretByUserId } from "@src/integrations/vault";
import { sign, verify } from "hono/jwt";
import { ENVIRONMENT, JWT_SECRET } from "@src/config/constants";
import { sendEmail } from "@src/integrations/smtp";
import { resetPasswordTokensRepository } from "@src/repositories/reset-password-tokens";

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
      sql`${fields.encryptedKey} = crypt(${key}, ${fields.encryptedKey}) and ${fields.isActive
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
  unitId: string
) => {

  const { id } = await userRepository.createUser(db, {
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

  if (!record || record.revoked || !record.expiresAt || record.expiresAt < new Date()) {
    throw new HTTPException(401, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid refresh token" })
      ),
    });
  }

  await refreshTokenRepository.revokeRefreshToken(db, refreshToken);

  return await createSession(db, record.userId);
};

/**
 * Generates a Time-based One-Time Password (TOTP) for a user.
 * 
 * @param db - The database connection instance.
 * @param userId - The unique identifier of the user.
 * @returns A Promise that resolves to the generated TOTP.
 * @throws Will throw an error if the user with the provided ID is not found.
 */
const generateOTP = async (db: DB, userId: string) => {
  const { email } = await userRepository.findUserById(db, userId);
  const totp = generateTOTP(email);
  await createOtpSecret(userId, totp.secret.base32);
  return totp;
}

/**
 * Verifies a user's Time-based One-Time Password (TOTP) token.
 * 
 * @param db - The database connection instance
 * @param userId - The unique identifier of the user
 * @param token - The TOTP token provided by the user for verification
 * @param secret - The secret key used for generating TOTP tokens
 * @returns A Promise resolving to a boolean indicating whether the TOTP token is valid
 * @throws Will throw an error if the user cannot be found or if verification fails
 */
const verifyUserTOTP = async (db: DB, userId: string, token: string) => {
  const { email } = await userRepository.findUserById(db, userId);
  const secret = await getOtpSecretByUserId(userId);

  return verifyTOTP(email, token, secret);
}

const generateResetPasswordToken = async (email: string) => {
  const data = await userRepository.findUserByEmail(db, email);

  if (!data) {
    throw new HTTPException(404, {
      res: new Response(
        JSON.stringify({ data: null, error: "User not found" })
      ),
    });
  }

  const { id } = data;

  const payload = { userId: id, exp: Date.now() + 1000 * 60 * 60 * 24 };

  const token = await sign(payload, JWT_SECRET);
  await resetPasswordTokensRepository.createPasswordResetToken(token, id);
  if (ENVIRONMENT === "production") {
    await sendEmail(email, "MSB Password Reset", "no-reply@example.com", `Click here to reset your password: ${BASE_URL}/reset-password?token=${token}`);
  } else {
    return token;
  }
}

const resetPassword = async (token: string, password: string) => {
  let payload;
  try {
    payload = await verify(token, JWT_SECRET);
    // @ts-ignore
  } catch (e) {
    throw new HTTPException(401, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid token" })
      ),
    });
  }

  const { userId } = payload as { userId: string };

  await resetPasswordTokensRepository.markPasswordResetTokenUsed(token, userId);
  try {
    await userRepository.updatePassword(db, userId, password);
  } catch (e) {
    console.error(`Failed to reset password: ${e}`);
    throw new HTTPException(501, { message: "Failed to reset password" });
  }
}


export const authService = {
  createUserWithPassword,
  signInWithPassword,
  retrieveApiKey,
  refreshToken,
  generateOTP,
  verifyUserTOTP,
  generateResetPasswordToken,
  resetPassword,
};
