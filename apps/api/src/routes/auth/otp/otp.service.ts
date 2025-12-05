import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import { Repository } from 'typeorm';
import { User } from '@infra/db/entity/user/user';
import { InjectRepository } from '@nestjs/typeorm';
import { KvService } from '@infra/kv/kv.service';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private logger = new Logger(OtpService.name);
  private kv: Redis;

  constructor(
    private readonly kvService: KvService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.kv = kvService.kv;
  }

  /**
   * Retrieve the user's email address by user ID.
   *
   * Performs a targeted lookup (selecting only the 'email' field) against the user repository
   * and returns the email as a string.
   *
   * @param userId - The identifier of the user to look up.
   * @returns Promise<string> - Resolves with the user's email address.
   * @throws {HttpException} Throws a 500 HttpException if a repository/database error occurs (the error is logged).
   * @throws {HttpException} Throws a 404 HttpException if the user is not found or the user has no email.
   */
  private async _getUserEmailById(userId: string): Promise<string> {
    let data: User | null;
    try {
      data = await this.userRepository.findOne({
        where: { id: userId },
        select: ['email'],
      });
    } catch (error) {
      this.logger.error(
        `Error fetching user email for userId ${userId}: ${error.message}`,
      );
      throw new HttpException(
        'Error fetching user email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!data || !data.email) {
      throw new HttpException('User email not found', HttpStatus.NOT_FOUND);
    }

    return data.email;
  }

  /**
   * Generates a time-based one-time password (TOTP) for a user and persists the
   * shared secret to the vault.
   *
   * This method:
   * - Retrieves the user's email via _getUserEmailById(userId) and uses it as the TOTP label.
   * - Constructs a TOTP with issuer "MSWA", algorithm "SHA1", 6 digits, and a 30-second period.
   * - Extracts the secret in base32 and stores it via vault.createOtpSecret(userId, secret).
   * - Returns the TOTP otpauth:// URL (suitable for QR code generation or authenticator apps)
   *   and the base32-encoded secret.
   *
   * @param userId - The identifier of the user for whom to generate the OTP secret.
   * @returns A promise that resolves to an object containing:
   *   - url: string — the otpauth TOTP URI (totp.toString()).
   *   - secret: string — the shared secret encoded as base32.
   * @throws {HttpException} If storing the OTP secret in the vault fails.
   */
  public async generateOtp(
    userId: string,
  ): Promise<{ url: string; secret: string }> {
    // fetch the user email from the database using userId
    const email = await this._getUserEmailById(userId);

    const totp = new OTPAuth.TOTP({
      issuer: 'MSWA',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    try {
      const key = `otp::${userId}`;
      await this.kv.set(key, secret);
      await this.kv.expire(key, 60 * 10); // expire after 10 minutes
    } catch (error) {
      this.logger.error(
        `Error storing OTP secret for userId ${userId}: ${error.message}`,
      );
      throw new HttpException(
        'Error storing OTP secret',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { url: totp.toString(), secret };
  }

  /**
   * Validate a time-based one-time password (TOTP) for a given user.
   *
   * This method:
   *  - Retrieves the user's email (used as the TOTP label) via _getUserEmailById.
   *  - Retrieves the user's OTP secret from the vault via getOtpSecretByUserId.
   *  - Constructs an OTPAuth.TOTP instance with the following parameters:
   *      issuer: 'MSWA', algorithm: 'SHA1', digits: 6, period: 30.
   *  - Validates the provided token against the constructed TOTP.
   *
   * The returned boolean is true only when the underlying TOTP validation returns
   * a non-null, non--1 result (i.e., the token is considered valid).
   *
   * @param userId - The unique identifier of the user whose OTP should be validated.
   * @param token - The one-time password token to validate (typically a 6-digit string).
   * @returns A promise that resolves to true if the token is valid, otherwise false.
   *
   * @throws If the user email cannot be retrieved, the OTP secret is missing or malformed,
   *         or if OTPAuth throws due to invalid inputs / internal errors.
   *
   * @example
   * const isValid = await service.verifyOtp('user-123', '123456');
   */
  public async verifyOtp(userId: string, token: string): Promise<boolean> {
    const email = await this._getUserEmailById(userId);
    const secret = await this.kv.get(`otp::${userId}`);

    if (!secret) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'MSWA',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const result = totp.validate({ token });
    const isValid = result === null ? false : result === -1 ? false : true;
    return isValid;
  }
}
