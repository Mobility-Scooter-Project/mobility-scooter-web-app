import { VAULT_ADDR, VAULT_TOKEN } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPException } from "hono/http-exception";
import VaultClient from "node-vault-client";
import * as crypto from "node:crypto";

export const vault = VaultClient.boot("main", {
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
  await vault.write(`kv/auth/otp/${userId}`, { secret });
};

/**
 * Retrieves the OTP (One-Time Password) secret for a specific user from Vault.
 *
 * @param userId - The unique identifier of the user whose OTP secret is being retrieved
 * @returns A Promise that resolves to the user's OTP secret as a string
 * @throws {HTTPException} With status code 404 if the TOTP does not exist for the user
 */
export const getOtpSecretByUserId = async (userId: string) => {
  try {
    const secret = await vault.read(`kv/auth/otp/${userId}`);
    return secret.getData().secret as string;
  } catch (e) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({ data: null, error: "TOTP does not exist" }),
      ),
    });
  }
};

/**
 * Creates and stores a new encryption key for a specific object in a bucket.
 * 
 * Generates a random 256-bit (32-byte) key for AES-256 encryption and stores it
 * in HashiCorp Vault under the path `kv/storage/${bucketId}/${objectId}`.
 * 
 * @param bucketId - The identifier of the bucket containing the object
 * @param path - The full path of the object for which to create the encryption key
 * @returns The generated encryption key as a hexadecimal string
 */
export const createObjectEncryptionKey = async (bucketId: string, path: string) => {
  const secret = crypto.randomBytes(32).toString("hex"); // 32 bytes = 256 bits for AES-256 encryption
  await vault.write(`kv/storage/${bucketId}/${path}`, { secret });
  return secret;
}

/**
 * Retrieves the encryption key for a specific object in a bucket from the vault.
 * 
 * @param bucketId - The ID of the bucket containing the object
 * @param path - The full path of the object for which to retrieve the encryption key
 * @returns A Promise that resolves to the encryption key as a string
 * @throws {HTTPException} With NOT_FOUND status if the encryption key does not exist in the vault
 */
export const getObjectEncryptionKey = async (bucketId: string, path: string) => {
  try {
    const secret = await vault.read(`kv/storage/${bucketId}/${path}`);
    return secret.getData().secret as string;
  } catch (e) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({ data: null, error: "Encryption key does not exist" }),
      ),
    });
  }
};

export const createObjectEncryptionIv = async (bucketId: string, path: string) => {
  const iv = crypto.randomBytes(16).toString("hex");
  await vault.write(`kv/storage/${bucketId}/${path}/iv`, { iv });
  return iv;
}

export const getObjectEncryptionIv = async (bucketId: string, path: string) => {
  try {
    const iv = await vault.read(`kv/storage/${bucketId}/${path}/iv`);
    return iv.getData().iv as string;
  } catch (e) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({ data: null, error: "IV does not exist" }),
      ),
    });
  }
};
