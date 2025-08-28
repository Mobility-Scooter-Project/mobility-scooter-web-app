import { ENVIRONMENT, STORAGE_BUCKET, VAULT_URL } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "inversify";
import * as crypto from "node:crypto";
import { KeystoneService } from "./auth/keystone";
import { KVSymbol } from "@src/lib/container";
import { KVService } from "./kv";
import Redis from "ioredis";
import logger from "@src/lib/logger";

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
@injectable()
export class VaultService {
  private _client?: AxiosInstance;
  private _keystone: KeystoneService;
  private _kv: Redis;

  private constructor(
    @inject(KeystoneService) keystone: KeystoneService,
    @inject(KVSymbol) private readonly kv: Redis
  ) {
    this._keystone = keystone;
    this._kv = kv;
  }

  private async _lazyInit() {
    if (!this._client) {
      const token = await this._keystone.getAuthToken();
      this._client = axios.create({
        baseURL: VAULT_URL,
        headers: {
          'X-Auth-Token': token,
          'Content-Type': 'application/json',
          'Accept': '*/*',
        },
      });
    }
  }

  public async upsertSecret(path: string, key: string, secret: string) {
    await this._lazyInit();
    secret = Buffer.from(secret, 'utf8').toString('base64'); // Encode secret to base64
      const response = await this._client!.post('/v1/secrets', JSON.stringify({
        payload: secret,
        secret_type: 'symmetric',
        payload_content_type: 'application/octet-stream',
        payload_content_encoding: 'base64',
      }));

      if (response.status == 401) {
        this._client!.defaults.headers['X-Auth-Token'] = await this._keystone.getAuthToken();
        const retryResponse = await this._client!.post('/v1/secrets', JSON.stringify({
          payload: secret,
          secret_type: 'symmetric',
          payload_content_type: 'application/octet-stream',
          payload_content_encoding: 'base64',
        }));

        if (!retryResponse.status.toString().includes('20')) {
          throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, retryResponse.data, `Failed to upsert secret at ${path}`);
        }
      } else if (!response.status.toString().includes('20')) {
        throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, response.data, `Failed to upsert secret at ${path}`);
      }

      let secretRef = await response.data["secret_ref"] + "/payload";
      if (!secretRef) {
        throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, "No secret reference returned from Vault");
      }

      secretRef = secretRef.replace("http://localhost:9311", "");
      secretRef = VAULT_URL + secretRef; // Ensure the secretRef is a full URL

      await this._kv.hmset(path, { [key]: secretRef });
  }

  public async readSecret(path: string, key: string) {
    await this._lazyInit();
    const secretRef = await this._kv.hget(path, key);

    // TODO: handle refresh from Barbican if needed
    if (!secretRef) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, `Secret not found at ${path}`);
    }

    const response = await this._client!.get(secretRef);

    if (response.status === 401) {
      this._client!.defaults.headers['X-Auth-Token'] = await this._keystone.getAuthToken();
      const retryResponse = await this._client!.get(secretRef);
      if (!retryResponse.status.toString().includes('20')) {
        throw new HTTPError(HTTP_CODES.NOT_FOUND, retryResponse.data, `Secret not found at ${path}`);
      }
      return retryResponse.data as string;
    }

    if (!response.status.toString().includes('20')) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, response.data, `Secret not found at ${path}`);
    }
    return response.data as string;
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
      await this.upsertSecret(`auth/otp`, userId, secret);
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
      return await this.readSecret(`auth/otp`, userId);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, e, "TOTP does not exist");
    }
  };

  /**
   * Creates and stores an encryption key in Vault for object encryption
   * @param path - The path within the bucket where the object will be stored
   * @returns A hexadecimal string representing the generated 256-bit encryption key
   * @throws {HTTPError} If the encryption key cannot be stored in Vault
   */
  public async createObjectEncryptionKey(path: string) {
    const secret = crypto.randomBytes(32).toString("hex"); // 32 bytes = 256 bits for AES-256 encryption
    try {
      await this.upsertSecret(`storage/${STORAGE_BUCKET}`, path, secret);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create encryption key");
    }
    return secret;
  }

  /**
   * Retrieves an encryption key for a specified object from Vault.
   * @param path - The path to the object within the bucket
   * @returns A promise that resolves to the encryption key as a string
   * @throws {HTTPError} With status 404 if the encryption key does not exist in Vault
   */
  public async getObjectEncryptionKey(path: string) {
    try {
      return await this.readSecret(`storage/${STORAGE_BUCKET}`, path);
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
      await this.upsertSecret(`auth/password-reset`, userId, JSON.stringify({ token, used: false }));
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
    const secret = await this.readSecret(`auth/password-reset`, userId);
    const parsedSecret = JSON.parse(JSON.stringify(secret));

    if (parsedSecret.used) {
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, "Password reset token has already been used");
    }

    if (parsedSecret.token !== token) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, "Password reset token does not match");
    }

    parsedSecret.used = true;
    await this.upsertSecret(`auth/password-reset`, userId, JSON.stringify(parsedSecret));
  }
}