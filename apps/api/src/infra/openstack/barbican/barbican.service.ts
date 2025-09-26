import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { KeystoneService } from '../keystone/keystone.service';
import { KvService } from '../../kv/kv.service';
import { HttpService } from '@nestjs/axios';
import { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class BarbicanService {
  private kv: Redis;
  private vaultUrl: string;
  private storageBucket: string = 'dev'; // Default bucket name
  private client: AxiosInstance;
  private readonly logger = new Logger(BarbicanService.name);

  constructor(
    private readonly KeystoneService: KeystoneService,
    private readonly KVService: KvService,
  ) {
    this.kv = KVService.kv;
  }

  public static async build(
    configService: ConfigService<AppConfig>,
    keystone: KeystoneService,
    kv: KvService,
    httpService: HttpService,
  ): Promise<BarbicanService> {
    const barbican = new BarbicanService(keystone, kv);

    const token = await keystone.getToken();
    barbican.vaultUrl = configService.get('vault').url;

    barbican.client = httpService.axiosRef.create({
      baseURL: barbican.vaultUrl,
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
    });

    barbican.client = barbican.client;

    return barbican;
  }

  /**
   * Upserts a secret by storing it in Barbican and caching the reference in Redis.
   *
   * This method encodes the secret as base64, stores it in OpenStack Barbican as a symmetric secret,
   * and then caches the secret reference URL in Redis using the provided path and key.
   *
   * @param path - The Redis hash key path where the secret reference will be stored
   * @param key - The field name within the Redis hash for this specific secret
   * @param secret - The plain text secret value to be stored (will be base64 encoded)
   *
   * @throws {HttpException} When key is missing (400 Bad Request)
   * @throws {HttpException} When Barbican API call fails (500 Internal Server Error)
   * @throws {HttpException} When no secret reference is returned from Barbican (500 Internal Server Error)
   *
   * @returns Promise that resolves when the secret is successfully stored and cached
   */
  public async upsertSecret(
    path: string,
    key: string,
    secret: string,
  ): Promise<void> {
    if (!key) {
      this.logger.error('Key is required to upsert secret');
      throw new HttpException(
        'Key is required to upsert secret',
        HttpStatus.BAD_REQUEST,
      );
    }

    secret = Buffer.from(secret, 'utf8').toString('base64'); // Encode secret to base64

    const response = await this.client.post(
      '/v1/secrets',
      JSON.stringify({
        payload: secret,
        secret_type: 'symmetric',
        payload_content_type: 'application/octet-stream',
        payload_content_encoding: 'base64',
      }),
    );

    if (!response.status.toString().includes('20')) {
      throw new HttpException(
        `Failed to upsert secret at ${path}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let secretRef = (await response.data['secret_ref']) + '/payload';
    if (!secretRef) {
      throw new HttpException(
        'No secret reference returned from Vault',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    secretRef = secretRef.replace('http://localhost:9311', '');
    secretRef = this.vaultUrl + secretRef; // Ensure the secretRef is a full URL

    await this.kv.hmset(path, { [key]: secretRef });
  }

  /**
   * Reads a secret from the vault using the specified path and key.
   *
   * @param path - The path where the secret is stored in the vault
   * @param key - The key identifier for the specific secret
   * @returns A promise that resolves to the secret value as a string
   * @throws {HttpException} Throws NOT_FOUND error if the secret is not found at the specified path
   * @throws {HttpException} Throws NOT_FOUND error if the vault service returns a non-2xx status code
   *
   * @remarks
   * This method performs lazy initialization of the vault service and automatically handles
   * authentication token refresh if a 401 Unauthorized response is received from the vault.
   * If the initial request fails with 401, it will retry once with a fresh authentication token.
   */
  public async readSecret(path: string, key: string) {
    const secretRef = await this.kv.hget(path, key);

    // TODO: handle refresh from Barbican if needed
    if (!secretRef) {
      this.logger.warn(
        `Secret not found in KV store at path: ${path} with key: ${key}`,
      );
      throw new HttpException(`Secret not found ${path}`, HttpStatus.NOT_FOUND);
    }

    const response = await this.client.get(secretRef);

    if (!response.status.toString().includes('20')) {
      throw new HttpException(
        `Secret not found at ${path}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return response.data as string;
  }

  /**
   * Creates a one-time password (OTP) secret for a user in the Vault.
   *
   * @param userId - The unique identifier of the user
   * @param secret - The OTP secret to be stored
   * @throws {HttpException} With status 500 if the secret creation fails
   * @returns {Promise<void>}
   */
  public async createOtpSecret(userId: string, secret: string) {
    try {
      await this.upsertSecret(`auth/otp`, userId, secret);
    } catch (e) {
      throw new HttpException(
        'Failed to create OTP secret',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves the TOTP secret for a specific user from the Vault.
   *
   * @param userId - The unique identifier of the user
   * @returns A Promise that resolves to the user's TOTP secret as a string
   * @throws {HttpException} When the TOTP secret is not found in the Vault with status code 404
   */
  public async getOtpSecretByUserId(userId: string) {
    try {
      return await this.readSecret(`auth/otp`, userId);
    } catch (e) {
      throw new HttpException('TOTP does not exist', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Creates and stores an encryption key in Vault for object encryption
   * @param path - The path within the bucket where the object will be stored
   * @returns A hexadecimal string representing the generated 256-bit encryption key
   * @throws {HttpException} If the encryption key cannot be stored in Vault
   */
  public async createObjectEncryptionKey(path: string) {
    const secret = crypto.randomBytes(32).toString('hex'); // 32 bytes = 256 bits for AES-256 encryption
    try {
      await this.upsertSecret(`storage/${this.storageBucket}`, path, secret);
    } catch (e) {
      throw new HttpException(
        'Failed to create encryption key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return secret;
  }

  /**
   * Retrieves an encryption key for a specified object from Vault.
   * @param path - The path to the object within the bucket
   * @returns A promise that resolves to the encryption key as a string
   * @throws {HttpException} With status 404 if the encryption key does not exist in Vault
   */
  public async getObjectEncryptionKey(path: string) {
    try {
      return await this.readSecret(`storage/${this.storageBucket}`, path);
    } catch (e) {
      throw new HttpException(
        'Encryption key does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Creates a password reset token for a user in the vault.
   * @param token - The password reset token to be stored
   * @param userId - The ID of the user requesting password reset
   * @throws {HttpException} Throws with status 500 if token creation fails
   * @returns {Promise<void>}
   */
  public async createPasswordResetToken(token: string, userId: string) {
    try {
      await this.upsertSecret(
        `auth/password-reset`,
        userId,
        JSON.stringify({ token, used: false }),
      );
    } catch (e) {
      throw new HttpException(
        'Failed to create password reset token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Marks a password reset token as used in the Vault KV store.
   * @param token - The password reset token to mark as used
   * @param userId - The ID of the user associated with the token
   * @throws {HttpException}
   *  - NOT_FOUND if token is not found or doesn't match stored token
   *  - BAD_REQUEST if token has already been used
   *  - INTERNAL_SERVER_ERROR if updating token status fails
   */
  public async markPasswordResetTokenUsed(token: string, userId: string) {
    const secret = await this.readSecret(`auth/password-reset`, userId);
    const parsedSecret = JSON.parse(JSON.stringify(secret));

    if (parsedSecret.used) {
      throw new HttpException(
        'Password reset token has already been used',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (parsedSecret.token !== token) {
      throw new HttpException(
        'Password reset token does not match',
        HttpStatus.NOT_FOUND,
      );
    }

    parsedSecret.used = true;
    await this.upsertSecret(
      `auth/password-reset`,
      userId,
      JSON.stringify(parsedSecret),
    );
  }
}
