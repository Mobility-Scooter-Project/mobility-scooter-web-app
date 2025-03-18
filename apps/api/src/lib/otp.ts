import * as OTPAuth from 'otpauth'

/**
 * Generates a Time-based One-Time Password (TOTP) generator for a given identifier.
 *
 * This function creates a TOTP instance configured with the following parameters:
 * - Issuer: MSWA (Mobility Scooter Web Application)
 * - Label: The provided identifier
 * - Algorithm: SHA1
 * - Digits: 6 (generates a 6-digit code)
 * - Period: 30 seconds (code validity period)
 *
 * @param identifier - A string that uniquely identifies the user or entity for whom the TOTP is being generated
 * @returns An OTPAuth.TOTP instance that can be used to generate time-based one-time passwords
 */
export const generateTOTP = (identifier: string) => {
  const totp = new OTPAuth.TOTP({
    issuer: 'MSWA',
    label: `${identifier}`,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })

  return totp
}

/**
 * Verifies a Time-based One-Time Password (TOTP) against a provided secret.
 *
 * @param identifier - The identifier associated with the TOTP, used as part of the label.
 * @param token - The TOTP token to validate.
 * @param secret - The base32-encoded secret key used to generate and verify the TOTP.
 * @returns A number indicating how many time steps the token is away from the current one,
 *          or null if the token is not valid within the validation window.
 *
 * @remarks
 * This function uses SHA1 algorithm, 6-digit tokens, and a 30-second period.
 * The issuer is set to "MSWA".
 */
export const verifyTOTP = (
  identifier: string,
  token: string,
  secret: string,
) => {
  const totp = new OTPAuth.TOTP({
    issuer: 'MSWA',
    label: `${identifier}`,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  return totp.validate({ token })
}
