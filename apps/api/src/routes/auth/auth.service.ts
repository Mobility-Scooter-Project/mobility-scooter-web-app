import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { JwtService } from '@nestjs/jwt';
import { User } from '@src/infra/db/entity/user/user';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { UserIdentity } from '@src/infra/db/entity/user/identity';
import { UserSession } from '@src/infra/db/entity/user/session';
import { IDENTITY_PROVIDERS, USER_ROLES } from '@config/enums';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtDto } from '@src/middleware/jwt/jwt.dto';
import { KvService } from '@infra/kv/kv.service';
import Redis from 'ioredis';
import { type Response } from 'express';
import { Unit } from '@src/infra/db/entity/unit/unit';
import { MailService } from '@infra/mail/mail.service';

type TokenResponse = {
  token: string;
};

type RequestPasswordResetResponse = {
  message: string;
  /** Present only when SMTP is off and a matching account exists (local dev / tests). */
  token?: string;
};

type RefreshTokenResponse = TokenResponse & {
  refreshToken: string;
};

const PASSWORD_RESET_JWT_PURPOSE = 'password_reset';
const JOIN_ORG_COMPLETE_JWT_PURPOSE = 'join_org_complete';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private kv: Redis;

  private nowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly db: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    private readonly kvService: KvService,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
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

  /**
   * Join-org application: creates a pending user (no password) and emails a link to set a password.
   * Completing that link verifies email ownership and activates sign-in (see completeJoinOrgApplication).
   * @param email - The email address of the user
   * @param orgId - The ID of the organization
   * @param unitId - The ID of the unit
   * @param profile - The profile of the user
   * @returns A promise that resolves to the message and complete token
   * @throws HttpException if the user already exists or the unit is invalid
   */
  public async submitJoinOrgApplication(
    email: string,
    orgId: string,
    unitId: string,
    profile?: { givenName?: string; surname?: string; intendedRole?: string },
  ): Promise<{ message: string; completeToken?: string }> {
    await this.cleanupStaleUnactivatedUsers();
    const unit = await this.resolveUnitForJoinByIds(orgId, unitId);
    const requestedRole = this.normalizeJoinOrgRole(profile?.intendedRole);

    const existing = await this.userRepository.findOne({
      where: { email },
      relations: ['unit'],
    });

    if (existing) {
      if (existing.passwordHash) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
      if (!existing.unit || existing.unit.id !== unit.id) {
        throw new HttpException(
          'You already have a pending application for a different organization or unit.',
          HttpStatus.BAD_REQUEST,
        );
      }
      return this.issueJoinOrgCompleteDelivery(
        existing.id,
        email,
        profile?.givenName,
        requestedRole ?? existing.role,
      );
    }

    const user = await this.saveJoinOrgApplicantWithoutPassword(email, {
      role: USER_ROLES.RESEARCHER,
      givenName: profile?.givenName,
      surname: profile?.surname,
      unit,
    });

    return this.issueJoinOrgCompleteDelivery(
      user.id,
      email,
      profile?.givenName,
      requestedRole ?? USER_ROLES.RESEARCHER,
    );
  }

  /**
   * Save a join organization applicant without a password.
   * @param email - The email address of the user
   * @param fields - The fields to save
   * @param fields.role - The role of the user
   * @param fields.givenName - The given name of the user
   * @param fields.surname - The surname of the user
   * @param fields.unit - The unit of the user
   * @returns A promise that resolves to the user
   */
  private async saveJoinOrgApplicantWithoutPassword(
    email: string,
    fields: {
      role: USER_ROLES;
      givenName?: string;
      surname?: string;
      unit: Unit;
    },
  ): Promise<User> {
    let user: User;
    try {
      user = await this.db.transaction(async (tx) => {
        const createdUser = await tx.save(
          tx.create(User, {
            email,
            passwordHash: null,
            role: fields.role,
            givenName: fields.givenName,
            surname: fields.surname,
            unit: fields.unit,
          }),
        );

        const newIdentity = tx.create(UserIdentity, {
          user: createdUser,
        });

        await tx.save(newIdentity);

        return createdUser;
      });
    } catch (error) {
      this.logger.error('Error creating join-org applicant user: ', error);
      throw new HttpException(
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return user;
  }

  /**
   * Issue a join organization complete delivery.
   * @param userId - The ID of the user
   * @param email - The email address of the user
   * @param givenName - The given name of the user
   * @param role - The role of the user
   * @returns A promise that resolves to the message and complete token
   */
  private async issueJoinOrgCompleteDelivery(
    userId: string,
    email: string,
    givenName: string | undefined,
    role: USER_ROLES,
  ): Promise<{ message: string; completeToken?: string }> {
    const token = await this.issueJoinOrgCompleteJwt(userId, email, role);
    const key = `join_org_complete_token::${userId}`;
    try {
      await this.kv.set(key, token);
      await this.kv.expire(key, 60 * 60 * 24);
    } catch (e) {
      this.logger.error('Error storing join-org complete token in KV', e);
      throw new HttpException(
        'Error preparing your application link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const webBase = this.configService.get('webAppUrl').replace(/\/$/, '');
    const completeUrl = `${webBase}/create-account?token=${encodeURIComponent(token)}`;

    if (this.mailService.isConfigured()) {
      try {
        await this.mailService.sendJoinOrgCompleteEmail({
          to: email,
          completeUrl,
          givenName,
        });
        return {
          message:
            'Application received. Check your email for a link to set your password and finish signup. The link expires in 24 hours.',
        };
      } catch (err) {
        this.logger.error('Failed to send join-org complete email', err);
        try {
          await this.kv.del(key);
        } catch (delErr) {
          this.logger.warn(
            'Failed to revoke join-org token after send failure',
            delErr,
          );
        }
        throw new HttpException(
          'We could not send the email. Try again later.',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    this.logger.warn(
      'SMTP not configured; join-org completion email was not sent.',
    );
    if (this.configService.get('environment') !== 'production') {
      this.logger.log(
        `Join-org complete URL (SMTP not configured): ${completeUrl}`,
      );
    }

    return {
      message:
        'Application received. This server is not sending email; when SMTP is off, a one-time completion token is included in this response for local development only.',
      completeToken: token,
    };
  }

  /**
   * Issue a join organization complete JWT.
   * @param userId - The ID of the user
   * @param email - The email address of the user
   * @param role - The role of the user
   * @returns A promise that resolves to the JWT
   */
  private async issueJoinOrgCompleteJwt(
    userId: string,
    email: string,
    role: USER_ROLES,
  ): Promise<string> {
    return await this.jwt.signAsync(
      {
        userId,
        email,
        role,
        purpose: JOIN_ORG_COMPLETE_JWT_PURPOSE,
        exp: this.nowInSeconds() + 60 * 60 * 24,
      },
      { secret: this.configService.get('jwtSecret') },
    );
  }

  /**
   * Preview a join organization complete JWT.
   * @param token - The JWT to preview
   * @returns A promise that resolves to the email of the user
   */
  public async previewJoinOrgComplete(token: string): Promise<{ email: string }> {
    let payload: { userId?: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch {
      throw new HttpException(
        'Invalid or expired link',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { userId, purpose } = payload as {
      userId?: string;
      purpose?: string;
    };

    if (purpose !== JOIN_ORG_COMPLETE_JWT_PURPOSE || !userId) {
      throw new HttpException(
        'Invalid or expired link',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const key = `join_org_complete_token::${userId}`;
    let stored: string | null;
    try {
      stored = await this.kv.get(key);
    } catch (e) {
      this.logger.error('Error reading join-org token from KV', e);
      throw new HttpException(
        'Invalid or expired link',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (stored !== token) {
      throw new HttpException(
        'Invalid or expired link',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.passwordHash) {
      throw new HttpException(
        'Invalid or expired link',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return { email: user.email };
  }

  /**
   * Complete a join organization application.
   * @param token - The JWT to complete the application
   * @param password - The password to set for the user
   * @returns A promise that resolves when the application is completed
   */
  public async completeJoinOrgApplication(
    token: string,
    password: string,
  ): Promise<void> {
    let payload: { userId?: string; purpose?: string; role?: USER_ROLES };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { userId, purpose, role } = payload as {
      userId?: string;
      purpose?: string;
      role?: USER_ROLES;
    };

    if (
      purpose !== JOIN_ORG_COMPLETE_JWT_PURPOSE ||
      !userId ||
      !role ||
      !Object.values(USER_ROLES).includes(role)
    ) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const key = `join_org_complete_token::${userId}`;
    let stored: string | null;
    try {
      stored = await this.kv.get(key);
    } catch (e) {
      this.logger.error('Error reading join-org token from KV', e);
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (stored !== token) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.passwordHash) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const hashedPasswordResult = await this.db.query(
        `SELECT crypt($1, gen_salt('bf')) as hash`,
        [password],
      );
      const newHash = hashedPasswordResult[0].hash;
      await this.userRepository.update(
        { id: userId },
        {
          passwordHash: newHash,
          role,
        },
      );
    } catch (e) {
      this.logger.error('Error completing join-org password: ', e);
      throw new HttpException(
        'Could not save your password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      await this.kv.del(key);
    } catch (e) {
      this.logger.error('Error deleting join-org token from KV', e);
      throw new HttpException(
        'Error finalizing signup',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a password matches a stored hash.
   * @param password - The password to check
   * @param passwordHash - The stored hash to compare against
   * @returns A promise that resolves to true if the password matches the hash, false otherwise
   */
  private async passwordMatchesStoredHash(
    password: string,
    passwordHash: string | null | undefined,
  ): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }
    const result = await this.db.query(`SELECT crypt($1, $2) as hash`, [
      password,
      passwordHash,
    ]);
    return result[0].hash === passwordHash;
  }

  /**
   * Resolve a unit for a join by its IDs.
   * @param orgId - The ID of the organization
   * @param unitId - The ID of the unit
   * @returns A promise that resolves to the unit
   */
  private async resolveUnitForJoinByIds(
    orgId: string,
    unitId: string,
  ): Promise<Unit> {
    const unit = await this.unitRepository.findOne({
      where: {
        id: unitId,
        org: { id: orgId },
      },
      relations: { org: true },
    });

    if (!unit || unit.cud?.deletedAt || unit.org?.cud?.deletedAt) {
      throw new HttpException(
        'Invalid organization or unit selection.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return unit;
  }

  /**
   * Normalize a join organization role.
   * @param role - The role to normalize
   * @returns A promise that resolves to the normalized role
   */
  private normalizeJoinOrgRole(role: string | undefined): USER_ROLES | null {
    if (typeof role !== 'string') {
      return null;
    }
    const trimmed = role.trim();
    if (!trimmed) {
      return null;
    }
    return Object.values(USER_ROLES).includes(trimmed as USER_ROLES)
      ? (trimmed as USER_ROLES)
      : null;
  }

  private async cleanupStaleUnactivatedUsers(): Promise<void> {
    const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      await this.userRepository.delete({
        passwordHash: IsNull(),
        cud: { createdAt: LessThan(staleCutoff) },
      });
    } catch (error) {
      this.logger.warn('Failed to clean stale unactivated users', error);
    }
  }

  /**
   * Create a user session.
   * @param userId - The ID of the user
   * @param userRole - The role of the user
   * @param identity - The identity of the user
   * @param res - The response object
   * @returns A promise that resolves to the refresh token response
   */
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
      exp: this.nowInSeconds() + 60 * 15, // 15 minutes
      iat: this.nowInSeconds(),
    });

    let refreshToken: string | undefined;
    try {
      refreshToken = await this.jwt.signAsync({
        userId: userId,
        userRole: userRole,
        sessionId: session.id,
        exp: this.nowInSeconds() + 60 * 60 * 24 * 30, // 30 days
        iat: this.nowInSeconds(),
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
      const secure = this.configService.get('environment') === 'production';
      const cookie =
        `refreshToken=${encodeURIComponent(refreshToken)}; ` +
        `HttpOnly; Path=/api/v1/auth/refresh-token; Max-Age=2592000; SameSite=Lax` +
        (secure ? '; Secure' : '');
      res.setHeader('Set-Cookie', cookie);
    }

    return { token, refreshToken };
  }

  /**
   * Invalidate a refresh token.
   * @param refreshToken - The refresh token to invalidate
   * @returns A promise that resolves when the refresh token is invalidated
   */
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
   * Clear a refresh token cookie.
   * @param res - The response object
   * @returns A promise that resolves when the refresh token cookie is cleared
   */
  private clearRefreshTokenCookie(res?: Response) {
    if (!res) {
      return;
    }
    const secure = this.configService.get('environment') === 'production';
    const cookie =
      'refreshToken=; HttpOnly; Path=/api/v1/auth/refresh-token; Max-Age=0; SameSite=Lax' +
      (secure ? '; Secure' : '');
    res.setHeader('Set-Cookie', cookie);
  }

  /**
   * Logout a user.
   * @param refreshToken - The refresh token to logout
   * @param res - The response object
   * @returns A promise that resolves to the logout response
   */
  public async logout(
    refreshToken: string | undefined,
    res?: Response,
  ): Promise<{ ok: true }> {
    if (refreshToken) {
      try {
        await this.refreshTokenRepository.delete({ token: refreshToken });
      } catch (e) {
        this.logger.warn('Error revoking refresh token during logout', e);
      }
    }

    this.clearRefreshTokenCookie(res);
    return { ok: true };
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

    let userRole = payload.userRole;
    if (userRole == null) {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        select: { id: true, role: true },
      });
      if (!user) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }
      userRole = user.role;
    }

    const newTokens = await this._createUserSession(
      payload.userId,
      userRole,
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
   * @throws {HttpException} 403 if the password is correct but email is not verified yet (may send a new verification email when SMTP is configured).
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

    if (!(await this.passwordMatchesStoredHash(password, user.passwordHash))) {
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
   * Starts password reset: same response whether or not the email exists (anti-enumeration).
   * When a user exists: stores a short-lived reset token in KV and emails a link (if SMTP is configured),
   * or returns the token in the JSON only when SMTP is not configured (development).
   * @param email - The email address of the user
   * @returns A promise that resolves to the request password reset response
   */
  public async generateResetPasswordToken(
    email: string,
  ): Promise<RequestPasswordResetResponse> {
    const publicMessage =
      'If an account exists for this email address, we sent password reset instructions.';

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

    if (!user) {
      return { message: publicMessage };
    }

    if (!user.passwordHash) {
      throw new HttpException(
        'Account has not been created yet.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = {
      userId: user.id,
      purpose: PASSWORD_RESET_JWT_PURPOSE,
      exp: this.nowInSeconds() + 60 * 60 * 24,
    };

    let token: string;
    try {
      token = await this.jwt.sign(payload);
    } catch (e) {
      throw new HttpException(
        'Error generating reset password token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

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

    const webBase = this.configService.get('webAppUrl').replace(/\/$/, '');
    const resetUrl = `${webBase}/reset-password?token=${encodeURIComponent(token)}`;

    if (this.mailService.isConfigured()) {
      try {
        await this.mailService.sendPasswordResetEmail({
          to: user.email,
          resetUrl,
        });
      } catch (err) {
        this.logger.error('Failed to send password reset email', err);
        try {
          await this.kv.del(`reset_password_token::${user.id}`);
        } catch (delErr) {
          this.logger.warn('Failed to revoke reset token after send failure', delErr);
        }
        throw new HttpException(
          'Could not send password reset email. Try again later.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return { message: publicMessage };
    }

    this.logger.warn(
      'SMTP not configured; password reset email not sent. Configure SMTP to email users.',
    );
    if (this.configService.get('environment') !== 'production') {
      this.logger.log(`Password reset URL (SMTP not configured): ${resetUrl}`);
    }

    return {
      message:
        publicMessage +
        ' This server is not sending email; when SMTP is off, the reset token is included in this response for local development only.',
      token,
    };
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
    const { userId, purpose } = payload as {
      userId?: string;
      purpose?: string;
    };

    if (purpose !== PASSWORD_RESET_JWT_PURPOSE || !userId) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const resetKey = `reset_password_token::${userId}`;
    let storedToken: string | null;
    try {
      storedToken = await this.kv.get(resetKey);
    } catch (e) {
      this.logger.error('Error reading password reset token from KV', e);
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (storedToken !== token) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }

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
      await this.kv.del(resetKey);
    } catch (e) {
      throw new HttpException(
        e.message,
        e.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
