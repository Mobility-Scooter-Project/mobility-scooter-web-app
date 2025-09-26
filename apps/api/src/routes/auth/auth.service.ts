import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config';

import { BarbicanService } from '../../infra/openstack/barbican/barbican.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@src/infra/db/entity/user/user';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { UserIdentity } from '@src/infra/db/entity/user/identity';
import { UserSession } from '@src/infra/db/entity/user/session';
import { IDENTITY_PROVIDERS } from '@src/infra/db/entity/user/enums';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly db: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly vault: BarbicanService,
    private readonly jwt: JwtService,
  ) {}

  public async createUserWithPassword(
    email: string,
    password: string,
    newUser: Partial<User>,
  ) {
    const result = await this.db.query(
      `SELECT crypt($1, gen_salt('bf')) as hash`,
      [password],
    );

    const passwordHash = result[0].hash;
    newUser.email = email;
    newUser.passwordHash = passwordHash;

    const userExists = await this.userRepository.findOne({ where: { email } });

    if (userExists) {
      throw new HttpException('User already exists', 400);
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
      throw new HttpException('Error creating user', 500);
    }

    return user;
  }

  /* istanbul ignore next */
  private async _createUserSession(
    userId: string,
    identity = IDENTITY_PROVIDERS.EMAIL,
  ) {
    let session;
    try {
      session = await this.db.transaction(async (tx) => {
        const identityRecord = await tx.getRepository(UserIdentity).findOne({
          where: {
            user: { id: userId },
            provider: identity,
          },
        });

        if (!identityRecord) {
          throw new HttpException('No identity found for user', 400);
        }

        const newSession = tx.create(UserSession, {
          identity: identityRecord,
        });

        const createdSession = await tx.save(newSession);
        return createdSession;
      });
    } catch (error) {
      this.logger.error('Error creating session: ', error);
      throw new HttpException('Error creating session', 500);
    }

    if (!session) {
      this.logger.error('No session created');
      throw new HttpException('Error creating session', 500);
    }

    const token = await this.jwt.signAsync({
      userId: userId,
      sessionId: session.id,
      exp: Number(Date.now() + 1000 * 60 * 15), // 15 minutes
      iat: Number(new Date().toISOString()),
    });

    let refreshToken;
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
      throw new HttpException('Error creating refresh token', 500);
    }

    return { token, refreshToken };
  }

  /* istanbul ignore next */
  private async _invalidateRefreshToken(refreshToken: string) {
    try {
      await this.refreshTokenRepository.delete({ token: refreshToken });
    } catch (e) {
      this.logger.error('Error revoking refresh token', e);
      throw new HttpException('Error revoking refresh token', e.status || 500);
    }
  }

  public async refreshToken(refreshToken: string) {
    let payload;
    try {
      payload = await this.jwt.verify(refreshToken, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch (e) {
      this.logger.error('Error verifying refresh token', e);
      throw new HttpException('Invalid refresh token', 401);
    }

    let tokenRecord;
    try {
      tokenRecord = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          expiresAt: MoreThan(new Date()),
        },
      });
    } catch (e) {
      this.logger.error('Error finding refresh token', e);
      throw new HttpException('Invalid refresh token', 401);
    }

    if (!tokenRecord) {
      this.logger.error(`Refresh token not found or revoked: ${refreshToken}`);
      throw new HttpException('Invalid refresh token', 401);
    }

    const newTokens = await this._createUserSession(payload.userId);

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
          throw new HttpException('Invalid refresh token', 401);
        }

        tokenRecord.token = newTokens.refreshToken;
        tokenRecord.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
        await this.refreshTokenRepository.save(tokenRecord);
      });
    } catch (e) {
      this.logger.error('Error revoking old refresh token', e);
      throw new HttpException('Error refreshing token', 500);
    }

    await this._invalidateRefreshToken(refreshToken);

    return newTokens;
  }

  public async signInWithPassword(email: string, password: string) {
    let user;

    try {
      // Get the user by email first
      user = await this.userRepository.findOne({ where: { email } });
    } catch (e) {
      this.logger.error('Error finding user by email', e);
      throw new HttpException('Invalid email or password', 401);
    }

    if (!user) {
      throw new HttpException('Invalid email or password', 401);
    }

    // Check password using the database crypt function
    const result = await this.db.query(`SELECT crypt($1, $2) as hash`, [
      password,
      user.passwordHash,
    ]);
    const hashedInputPassword = result[0].hash;

    if (hashedInputPassword !== user.passwordHash) {
      throw new HttpException('Invalid email or password', 401);
    }

    return this._createUserSession(user.id);
  }

  public async generateResetPasswordToken(email: string) {
    let data;
    try {
      data = await this.userRepository.findOne({ where: { email } });
    } catch (e) {
      throw new HttpException('Error generating reset password token', 500);
    }

    const { id } = data ? data : { id: '' };

    const payload = {
      userId: id,
      exp: Number(Date.now() + 1000 * 60 * 60 * 24),
    };

    let token;
    try {
      token = await this.jwt.sign(payload);
    } catch (e) {
      throw new HttpException('Error generating reset password token', 500);
    }

    if (data) {
      try {
        await this.vault.createPasswordResetToken(token, id);
      } catch (e) {
        throw new HttpException('Error storing reset password token', 500);
      }
    }

    // NOTE: In prod this should send an email but we are ignoring that for now and returning the token instaed.
    return { token };
  }

  public async resetPassword(token: string, newPassword: string) {
    let payload;

    try {
      payload = this.jwt.verify(token, {
        secret: this.configService.get('jwtSecret'),
      });
    } catch (e) {
      throw new HttpException('Invalid or expired token', 401);
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
      throw new HttpException('Error resetting password', 500);
    }

    try {
      await this.vault.markPasswordResetTokenUsed(token, userId);
    } catch (e) {
      throw new HttpException(e.message, e.status || 500);
    }
  }
}
