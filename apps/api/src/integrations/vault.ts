import { COMMON_HEADERS } from "@src/config/common-headers";
import { VAULT_ADDR, VAULT_TOKEN } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPException } from "hono/http-exception";
import VaultClient from "node-vault-client";
import * as crypto from "node:crypto";

export class Vault {
  private static instance: VaultClient;

  public constructor() {
    if (!Vault.instance) {
      try {
        Vault.instance = VaultClient.boot("main", {
          api: {
            url: VAULT_ADDR,
          },
          auth: {
            type: "token",
            config: {
              token: VAULT_TOKEN,
            },
          },
        });
      } catch (error) {
        console.error("Failed to connect to Vault:", error);
      }
    }
  }

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
  public async createOtpSecret(userId: string, secret: string) {
    await Vault.instance.write(`kv/auth/otp/${userId}`, { secret });
  };

  /**
   * Retrieves the OTP (One-Time Password) secret for a specific user from Vault.
   *
   * @param userId - The unique identifier of the user whose OTP secret is being retrieved
   * @returns A Promise that resolves to the user's OTP secret as a string
   * @throws {HTTPException} With status code 404 if the TOTP does not exist for the user
   */
  public async getOtpSecretByUserId(userId: string) {
    try {
      const secret = await Vault.instance.read(`kv/auth/otp/${userId}`);
      return secret.getData().secret as string;
    } catch (e) {
      throw new HTTPException(HTTP_CODES.NOT_FOUND, {
        res: new Response(
          JSON.stringify({ data: null, error: "TOTP does not exist" }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }
  };

  /**
   * Creates and stores a new encryption key for a specific object in a bucket.
   * 
   * Generates a random 256-bit (32-byte) key for AES-256 encryption and stores it
   * in HashiCorp Vault under the path `kv/storage/${bucketName}/${objectId}`.
   * 
   * @param bucketName - The identifier of the bucket containing the object
   * @param path - The full path of the object for which to create the encryption key
   * @returns The generated encryption key as a hexadecimal string
   */
  public async createObjectEncryptionKey(bucketName: string, path: string) {
    const secret = crypto.randomBytes(32).toString("hex"); // 32 bytes = 256 bits for AES-256 encryption
    await Vault.instance.write(`kv/storage/${bucketName}/${path}`, { secret });
    return secret;
  }

  /**
   * Retrieves the encryption key for a specific object in a bucket from the vault.
   * 
   * @param bucketName - The ID of the bucket containing the object
   * @param path - The full path of the object for which to retrieve the encryption key
   * @returns A Promise that resolves to the encryption key as a string
   * @throws {HTTPException} With NOT_FOUND status if the encryption key does not exist in the vault
   */
  public async getObjectEncryptionKey(bucketName: string, path: string) {
    try {
      const secret = await Vault.instance.read(`kv/storage/${bucketName}/${path}`);
      return secret.getData().secret as string;
    } catch (e) {
      throw new HTTPException(HTTP_CODES.NOT_FOUND, {
        res: new Response(
          JSON.stringify({ data: null, error: "Encryption key does not exist" }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }
  };

  /**
 * Creates a password reset token for a user in the vault.
 * @param {string} token - The password reset token to be stored.
 * @param {string} userId - The ID of the user for whom the token is being created.
 * @returns {Promise<void>} A promise that resolves when the token is successfully created.
 * @throws {Error} Throws an error if the token creation fails.
 */
  public async createPasswordResetToken(token: string, userId: string) {
    try {
      await Vault.instance.write(`kv/auth/password-reset/${userId}`, {
        token,
        used: false,
      });
    } catch (e) {
      console.error(`Failed to create password reset token: ${e}`);
      throw new Error("Failed to create password reset token");
    }
  };

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
  public async markPasswordResetTokenUsed(token: string, userId: string) {
    const data = (await Vault.instance.read(`kv/auth/password-reset/${userId}`)).getData();
    if (!data || data.token !== token) {
      throw new HTTPException(HTTP_CODES.NOT_FOUND, {
        res: new Response(JSON.stringify({ data: null, error: "Token not found" }), {
          headers: COMMON_HEADERS.CONTENT_TYPE_JSON,
        }),
      });
    }
    if (data.used) {
      throw new HTTPException(HTTP_CODES.CONFLICT, {
        res: new Response(JSON.stringify({ data: null, error: "Token already used" }), {
          headers: COMMON_HEADERS.CONTENT_TYPE_JSON
        }),
      });
    }

    try {
      await Vault.instance.write(`kv/auth/password-reset/${userId}`, {
        token,
        used: true,
      });
    } catch (e) {
      console.error(`Failed to mark password reset token as used: ${e}`);
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({ data: null, error: "Failed to mark token as used" }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }
  };
}

export const vault = new Vault();