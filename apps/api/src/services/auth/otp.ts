import { createOtpSecret, getOtpSecretByUserId } from "@src/integrations/vault";
import { generateTOTP, verifyTOTP } from "@src/lib/otp";
import type { DB } from "@src/middleware/db";
import { userRepository } from "@src/repositories/user";

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
};

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
};

export const otpService = {
  generateOTP,
  verifyUserTOTP,
};
