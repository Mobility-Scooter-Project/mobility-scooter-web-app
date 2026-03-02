import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { BarbicanService } from '../../infra/openstack/barbican/barbican.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@src/infra/db/entity/user/user';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { UserIdentity } from '@src/infra/db/entity/user/identity';
import { UserSession } from '@src/infra/db/entity/user/session';
import { IDENTITY_PROVIDERS, USER_ROLES } from '@config/enums';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtDto } from '@src/middleware/jwt/jwt.dto';
import { KvService } from '@infra/kv/kv.service';
import Redis from 'ioredis';
import { type Response } from 'express';

type TokenResponse = {
  token: string;
};

type RefreshTokenResponse = TokenResponse & {
  refreshToken: string;
};
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private kv: Redis;

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly db: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly kvService: KvService,
    private readonly jwt: JwtService,
  ) {
    this.kv = kvService.kv;
  }

  /**
   * Create a new user with a hashed password and an associated UserIdentity.
   *
   * This method:
   *  - hashes the provided plaintext password using PostgreSQL's crypt() with gen_salt('bf') (bcrypt),
   *  - sets newUser.email and newUser.passwordHash,
   *  - prevents creation if a user with the same email already exists,
   *  - persists the new user and a related UserIdentity inside a single transaction.
   *
   * @param email - The user's email address; used as the unique identifier.
   * @param password - The plaintext password to be hashed and stored as passwordHash.
   * @param newUser - Partial user object to populate and persist (email and passwordHash will be set/overwritten).
   *
   * @returns A Promise that resolves to the created User entity.
   *
   * @throws HttpException 400 if a user with the given email already exists.
   * @throws HttpException 500 if an error occurs while creating the user or associated identity.
   *
   * @remarks
   * - The passed newUser object is mutated: its email and passwordHash properties are assigned before persistence.
   * - The implementation relies on a database query for hashing and a transactional save to ensure both user and identity
   *   are created atomically.
   * - Errors during creation are logged before throwing.
   */
  public async createUserWithPassword(
    email: string,
    password: string,
    newUser: Partial<User>,
  ): Promise<User> {
    const result = await this.db.query(
      `SELECT crypt($1, gen_salt('bf')) as hash`,
      [password],
    );

    const passwordHash = result[0].hash;
    newUser.email = email;
    newUser.passwordHash = passwordHash;

    const userExists = await this.userRepository.findOne({ where: { email } });

    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    let user;
    try {
      user = await this.db.transaction(async (tx) => {
        const createdUser = await tx.save(newUser);

        const newIdentity = tx.create(UserIdentity, {
          user: createdUser,
        });

        await tx.save(newIdentity);

        return createdUser;
      });
    } catch (error) {
      this.logger.error('Error creating user: ', error);
      throw new HttpException(
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user;
  }

  /* istanbul ignore next */
  private async _createUserSession(
    userId: string,
    userRole: USER_ROLES,
    identity = IDENTITY_PROVIDERS.EMAIL,
    res?: Response,
  ): Promise<RefreshTokenResponse> {
    let session: UserSession | null;
    try {
      session = await this.db.transaction(async (tx) => {
        const identityRecord = await tx.getRepository(UserIdentity).findOne({
          where: {
            user: { id: userId },
            provider: identity,
          },
        });

        if (!identityRecord) {
          throw new HttpException(
            'No identity found for user',
            HttpStatus.BAD_REQUEST,
          );
        }

        const newSession = tx.create(UserSession, {
          identity: identityRecord,
        });

        const createdSession = await tx.save(newSession);
        return createdSession;
      });
    } catch (error) {
      this.logger.error('Error creating session: ', error);
      throw new HttpException(
        'Error creating session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!session) {
      this.logger.error('No session created');
      throw new HttpException(
        'Error creating session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const token = await this.jwt.signAsync({
      userId: userId,
      userRole: userRole,
      sessionId: session.id,
      exp: Number(Date.now() + 1000 * 60 * 15), // 15 minutes
      iat: Number(new Date().toISOString()),
    });

    let refreshToken: string | undefined;
    try {
      refreshToken = await this.jwt.signAsync({
        userId: userId,
        sessionId: session.id,
        exp: Number(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        iat: Number(new Date().toISOString()),
      });

      const newRefreshToken = this.refreshTokenRepository.create({
        token: refreshToken,
        session: { id: session.id },
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      });
      await this.refreshTokenRepository.save(newRefreshToken);
    } catch (error) {
      this.logger.error('Error creating refresh token', error);
      throw new HttpException(
        'Error creating refresh token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Set refresh token as HttpOnly cookie
    // res - Express response object
    // refreshToken - The refresh token value to set in cookie
    if (res) {
      const secure = process.env.NODE_ENV === 'production';
      const cookie =
        `refreshToken=${encodeURIComponent(refreshToken)}; ` +
        `HttpOnly; Path=/api/v1/auth/refresh-token; Max-Age=2592000; SameSite=Lax` +
        (secure ? '; Secure' : '');
      res.append('Set-Cookie', cookie);
    }

    return { token, refreshToken };
  }

  /* istanbul ignore next */
  private async _invalidateRefreshToken(refreshToken: string) {
    try {
      await this.refreshTokenRepository.delete({ token: refreshToken });
    } catch (e) {
      this.logger.error('Error revoking refresh token', e);
      throw new HttpException(
        'Error revoking refresh token',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refreshes an authentication session using the provided refresh token.
   *
   * Verifies the JWT refresh token, ensures a corresponding non-expired refresh-token record exists
   * in the database, creates a new user session (issuing new tokens), updates the stored refresh-token
   * record inside a database transaction to replace the token and align expiry, and finally invalidates
   * the old refresh token.
   *
   * @param refreshToken - The JWT refresh token presented by the client.
   * @returns A promise that resolves to an object containing the newly issued tokens (for example, an accessToken and a refreshToken)
   *          and any associated expiry information emitted by the session creation helper.
   * @throws {HttpException} 401 - Thrown when the refresh token is invalid, expired, not found, or has been revoked.
   * @throws {HttpException} 500 - Thrown when an unexpected error occurs while updating or revoking tokens (e.g., DB transaction failure).
   * @remarks
   * - The token is verified using the configured JWT secret.
   * - The refresh-token record lookup requires the record's expiresAt to be in the future.
   * - The DB transaction sets a specific role before performing the update.
   * - The old refresh token is invalidated after issuing the new tokens.
   * - Errors are logged before corresponding exceptions are thrown.
   */
  public async refreshToken(
    refreshToken: string,
    res?: Response,
  ): Promise<RefreshTokenResponse> {
    let payload: JwtDto | null;
    try {
      payload = await this.jwt.verify<JwtDto>(refreshToken, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch (e) {
      this.logger.error('Error verifying refresh token', e);
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    let tokenRecord: RefreshToken | null;
    try {
      tokenRecord = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          expiresAt: MoreThan(new Date()),
        },
      });
    } catch (e) {
      this.logger.error('Error finding refresh token', e);
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    if (!tokenRecord) {
      this.logger.error(`Refresh token not found or revoked: ${refreshToken}`);
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const newTokens = await this._createUserSession(
      payload.userId,
      payload.userRole,
      IDENTITY_PROVIDERS.EMAIL,
      res,
    );

    try {
      // update the new refresh token record to have the same expiry as the old one
      await this.db.transaction(async (tx) => {
        await tx.query(`SET ROLE postgres`);

        tokenRecord = await this.refreshTokenRepository.findOne({
          where: { token: refreshToken },
        });

        if (!tokenRecord) {
          this.logger.error(
            `Refresh token not found or revoked during refresh: ${refreshToken}`,
          );
          throw new HttpException(
            'Invalid refresh token',
            HttpStatus.UNAUTHORIZED,
          );
        }

        tokenRecord.token = newTokens.refreshToken;
        tokenRecord.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
        await this.refreshTokenRepository.save(tokenRecord);
      });
    } catch (e) {
      this.logger.error('Error revoking old refresh token', e);
      throw new HttpException(
        'Error refreshing token',
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this._invalidateRefreshToken(refreshToken);

    return newTokens;
  }

  /**
   * Authenticate a user by email and password and create a session on success.
   *
   * @remarks
   * - Looks up the user by email using the injected userRepository.
   * - Uses a database-side crypt(...) call to hash the provided plaintext password
   *   with the stored password hash, then compares the result to the stored hash.
   * - If the user is not found, the password does not match, or a lookup error occurs,
   *   an HttpException with status 401 and message "Invalid email or password" is thrown.
   * - On successful authentication, delegates session creation to _createUserSession(user.id).
   *
   * @param email - The email address of the user attempting to sign in.
   * @param password - The plaintext password provided by the user.
   *
   * @returns A Promise that resolves to the created user session (the return value of _createUserSession).
   *
   * @throws {HttpException} 401 if the email is not found, the password is invalid, or there is an error during lookup.
   */
  public async signInWithPassword(
    email: string,
    password: string,
    res?: Response,
  ): Promise<RefreshTokenResponse> {
    let user: User | null;

    try {
      // Get the user by email first
      user = await this.userRepository.findOne({ where: { email } });
    } catch (e) {
      this.logger.error('Error finding user by email', e);
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check password using the database crypt function
    const result = await this.db.query(`SELECT crypt($1, $2) as hash`, [
      password,
      user.passwordHash,
    ]);
    const hashedInputPassword = result[0].hash;

    if (hashedInputPassword !== user.passwordHash) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this._createUserSession(
      user.id,
      user.role,
      IDENTITY_PROVIDERS.EMAIL,
      res,
    );
  }

  /**
   * Generates a password reset token for the given email address.
   *
   * Workflow:
   * - Looks up a user by the provided email via this.userRepository.findOne.
   * - Builds a JWT payload containing:
   *   - userId: the user's id if found, otherwise an empty string.
   *   - exp: expiration set to Date.now() + 24 hours (value is a numeric timestamp as computed in milliseconds).
   * - Signs the payload with this.jwt.sign() to produce the token.
   * - If a user was found, stores the token via this.vault.createPasswordResetToken(token, id).
   * - Returns an object containing the token.
   *
   * Note:
   * - In production this method should send the token to the user's email; in the current implementation it returns the token directly.
   * - If no user is found for the given email, a token is still generated (with an empty userId) but it is not persisted to the vault.
   *
   * @param email - The email address to generate a reset token for.
   * @returns A promise resolving to an object with the generated token: { token: string }.
   * @throws HttpException with status 500 and message 'Error generating reset password token' when user lookup or JWT signing fails.
   * @throws HttpException with status 500 and message 'Error storing reset password token' when persisting the token to the vault fails.
   * @remarks The implementation currently sets exp using a millisecond timestamp (Date.now() + 24h). If this token is intended for use as a JWT exp claim, verify whether seconds-since-epoch are required by the JWT library/consumers.
   */
  public async generateResetPasswordToken(
    email: string,
  ): Promise<TokenResponse> {
    let user: User | null;
    try {
      user = await this.userRepository.findOne({ where: { email } });
    } catch (e) {
      this.logger.error('Error finding user by email for password reset', e);
      throw new HttpException(
        'Error generating reset password token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { id } = user ? user : { id: '' };

    const payload = {
      userId: id,
      exp: Number(Date.now() + 1000 * 60 * 60 * 24),
    };

    let token;
    try {
      token = await this.jwt.sign(payload);
    } catch (e) {
      throw new HttpException(
        'Error generating reset password token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (user) {
      try {
        const key = `reset_password_token::${user.id}`;
        await this.kv.set(key, token);
        await this.kv.expire(key, 60 * 15); // 15 minutes
      } catch (e) {
        throw new HttpException(
          'Error storing reset password token',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // NOTE: In prod this should send an email but we are ignoring that for now and returning the token instaed.
    return { token };
  }

  /**
   * Resets a user's password using a password-reset JWT token.
   *
   * Verifies the provided JWT token (using the configured `jwtSecret`) and
   * extracts the `userId` from the token payload. If verification succeeds,
   * the new plaintext password is hashed (via the database using
   * `crypt(..., gen_salt('bf'))`) and the user's `passwordHash` is updated
   * in the user repository. Finally, the reset token is marked as used in
   * the vault to prevent reuse.
   *
   * @param token - A JWT password-reset token issued to the user.
   * @param newPassword - The new plaintext password to set for the user.
   *
   * @returns A promise that resolves once the password has been updated and
   * the token marked as used.
   *
   * @throws {HttpException} 401 - Thrown when the token is invalid or expired.
   * @throws {HttpException} 500 - Thrown when hashing or updating the password fails.
   * @throws {HttpException} (e.status || 500) - Thrown when marking the token used in the vault fails.
   *
   * @remarks
   * - Expects the token payload to contain a `userId` property.
   * - Uses the database's `crypt` with Blowfish (`gen_salt('bf')`) for hashing.
   * - Logs internal errors when password reset fails.
   *
   * @security
   * - Ensure the `newPassword` meets your application's password policy before calling.
   * - Ensure communications with the API and database are protected (e.g., TLS).
   * - The reset token is intended to be single-use; this method marks it as used.
   */
  public async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    let payload;

    try {
      payload = this.jwt.verify(token, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch (e) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { userId } = payload;

    try {
      const hashedPasswordResult = await this.db.query(
        `SELECT crypt($1, gen_salt('bf')) as hash`,
        [newPassword],
      );
      const newHashedPassword = hashedPasswordResult[0].hash;
      await this.userRepository.update(
        { id: userId },
        { passwordHash: newHashedPassword },
      );
    } catch (e) {
      this.logger.error('Error resetting password: ', e);
      throw new HttpException(
        'Error resetting password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      await this.kv.del(`reset_password_token::${userId}`);
    } catch (e) {
      throw new HttpException(
        e.message,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
