import { HTTP_CODES } from '@src/config/http-codes'
import { vault } from '@src/integrations/vault'
import { HTTPException } from 'hono/http-exception'

/**
 * Creates a password reset token for a user in the vault.
 * @param {string} token - The password reset token to be stored.
 * @param {string} userId - The ID of the user for whom the token is being created.
 * @returns {Promise<void>} A promise that resolves when the token is successfully created.
 * @throws {Error} Throws an error if the token creation fails.
 */
const createPasswordResetToken = async (token: string, userId: string) => {
  try {
    await vault.write(`kv/auth/password-reset/${userId}`, {
      token,
      used: false,
    })
  } catch (e) {
    console.error(`Failed to create password reset token: ${e}`)
    throw new Error('Failed to create password reset token')
  }
}

/**
 * Marks a password reset token as used in the vault.
 *
 * @param token - The password reset token to mark as used
 * @param userId - The user ID associated with the token
 * @throws {HTTPException} - With status 404 if the token is not found for the user
 * @throws {HTTPException} - With status 400 if the token has already been used
 * @throws {Error} - If there's an issue updating the token in the vault
 * @returns {Promise<void>} - A promise that resolves when the token is successfully marked as used
 */
const markPasswordResetTokenUsed = async (token: string, userId: string) => {
  const data = (await vault.read(`kv/auth/password-reset/${userId}`)).getData()
  if (!data || data.token !== token) {
    throw new HTTPException(404, {
      res: new Response(JSON.stringify({ error: 'Token not found' }), {
        status: HTTP_CODES.NOT_FOUND,
      }),
    })
  }
  if (data.used) {
    throw new HTTPException(400, {
      res: new Response(JSON.stringify({ error: 'Token already used' }), {
        status: HTTP_CODES.BAD_REQUEST,
      }),
    })
  }

  try {
    await vault.write(`kv/auth/password-reset/${userId}`, {
      token,
      used: true,
    })
  } catch (e) {
    console.error(`Failed to mark password reset token as used: ${e}`)
    throw new Error('Failed to mark password reset token as used')
  }
}

export const resetPasswordTokensRepository = {
  createPasswordResetToken,
  markPasswordResetTokenUsed,
}
