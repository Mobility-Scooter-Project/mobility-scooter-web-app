import { VAULT_ADDR, VAULT_TOKEN } from '@src/config/constants'
import { HTTP_CODES } from '@src/config/http-codes'
import { HTTPException } from 'hono/http-exception'
import VaultClient from 'node-vault-client'

export const vault = VaultClient.boot('main', {
  api: {
    url: VAULT_ADDR,
  },
  auth: {
    type: 'token',
    config: {
      token: VAULT_TOKEN,
    },
  },
})

/**
 * Creates an OTP (One-Time Password) secret for a user in Vault.
 *
 * This function stores a secret value in Vault under the path `kv/auth/otp/{userId}`.
 * The secret is stored in a key-value pair where the key is "secret" and the value is the provided secret string.
 *
 * @param userId - The unique identifier of the user for whom the OTP secret is being created
 * @param secret - The OTP secret value to store in Vault
 * @returns A Promise that resolves when the secret has been written to Vault
 */
export const createOtpSecret = async (userId: string, secret: string) => {
  await vault.write(`kv/auth/otp/${userId}`, { secret })
}

/**
 * Retrieves the OTP (One-Time Password) secret for a specific user from Vault.
 *
 * @param userId - The unique identifier of the user whose OTP secret is being retrieved
 * @returns A Promise that resolves to the user's OTP secret as a string
 * @throws {HTTPException} With status code 404 if the TOTP does not exist for the user
 */
export const getOtpSecretByUserId = async (userId: string) => {
  try {
    const secret = await vault.read(`kv/auth/otp/${userId}`)
    return secret.getData().secret as string
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({ data: null, error: 'TOTP does not exist' }),
      ),
    })
  }
}
