import { VAULT_ADDR, VAULT_TOKEN } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import VaultClient from "node-vault-client";
import * as crypto from "node:crypto";

/**
 * A singleton class that handles interactions with HashiCorp Vault for secret management.
 * This class provides functionality for managing OTP secrets, encryption keys, and password reset tokens.
 * 
 * @class
 * @description The Vault class implements various secret management operations including:
 * - OTP (One-Time Password) secret management
 * - Object encryption key management for storage
 * - Password reset token management
 * 
 * The class uses a singleton pattern to maintain a single instance of the VaultClient.
 * 
 * @throws {Error} When initialization of the Vault client fails
 * @example
 * ```typescript
 * const vault = new Vault();
 * await vault.createOtpSecret('userId', 'secretValue');
 * ```
 */
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
   * Creates a one-time password (OTP) secret for a user in the Vault.
   * 
   * @param userId - The unique identifier of the user
   * @param secret - The OTP secret to be stored
   * @throws {HTTPError} With status 500 if the secret creation fails
   * @returns {Promise<void>}
   */
  public async createOtpSecret(userId: string, secret: string) {
    try {
      await Vault.instance.write(`kv/auth/otp/${userId}`, { secret });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create OTP secret");
    }
  };


  /**
   * Retrieves the TOTP secret for a specific user from the Vault.
   * 
   * @param userId - The unique identifier of the user
   * @returns A Promise that resolves to the user's TOTP secret as a string
   * @throws {HTTPError} When the TOTP secret is not found in the Vault with status code 404
   */
  public async getOtpSecretByUserId(userId: string) {
    try {
      const secret = await Vault.instance.read(`kv/auth/otp/${userId}`);
      return secret.getData().secret as string;
    } catch (e) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, e, "TOTP does not exist");
    }
  };


  /**
   * Creates and stores an encryption key in Vault for object encryption
   * @param bucketName - The name of the storage bucket
   * @param path - The path within the bucket where the object will be stored
   * @returns A hexadecimal string representing the generated 256-bit encryption key
   * @throws {HTTPError} If the encryption key cannot be stored in Vault
   */
  public async createObjectEncryptionKey(bucketName: string, path: string) {
    const secret = crypto.randomBytes(32).toString("hex"); // 32 bytes = 256 bits for AES-256 encryption
    try {
      await Vault.instance.write(`kv/storage/${bucketName}/${path}`, { secret });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create encryption key");
    }
    return secret;
  }

  /**
   * Retrieves an encryption key for a specified object from Vault.
   * @param bucketName - The name of the bucket where the object is stored
   * @param path - The path to the object within the bucket
   * @returns A promise that resolves to the encryption key as a string
   * @throws {HTTPError} With status 404 if the encryption key does not exist in Vault
   */
  public async getObjectEncryptionKey(bucketName: string, path: string) {
    try {
      const secret = await Vault.instance.read(`kv/storage/${bucketName}/${path}`);
      return secret.getData().secret as string;
    } catch (e) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, "Encryption key does not exist");
    }
  };

  /**
   * Creates a password reset token for a user in the vault.
   * @param token - The password reset token to be stored
   * @param userId - The ID of the user requesting password reset
   * @throws {HTTPError} Throws with status 500 if token creation fails
   * @returns {Promise<void>}
   */
  public async createPasswordResetToken(token: string, userId: string) {
    try {
      await Vault.instance.write(`kv/auth/password-reset/${userId}`, {
        token,
        used: false,
      });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create password reset token");
    }
  };


  /**
   * Marks a password reset token as used in the Vault KV store.
   * @param token - The password reset token to mark as used
   * @param userId - The ID of the user associated with the token
   * @throws {HTTPError} 
   *  - NOT_FOUND if token is not found or doesn't match stored token
   *  - BAD_REQUEST if token has already been used
   *  - INTERNAL_SERVER_ERROR if updating token status fails
   */
  public async markPasswordResetTokenUsed(token: string, userId: string) {
    const data = (await Vault.instance.read(`kv/auth/password-reset/${userId}`)).getData();
    if (!data || data.token !== token) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, "Token not found");
    }
    if (data.used) {
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, "Token already used");
    }

    try {
      await Vault.instance.write(`kv/auth/password-reset/${userId}`, {
        token,
        used: true,
      });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to mark token as used");
    }
  };
}

export const vault = new Vault();