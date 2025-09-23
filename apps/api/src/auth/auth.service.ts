import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql, eq, and } from 'drizzle-orm';
import { AppConfig } from 'src/config';
import { DB, DbService } from 'src/infra/db/db.service';
import { identities, refreshTokens, sessions, users } from 'src/infra/db/schema/auth';
import { BarbicanService } from 'src/infra/openstack/barbican/barbican.service';
import { JwtService } from '@nestjs/jwt';
import { runInThisContext } from 'vm';

type NewUser = typeof users.$inferInsert;

@Injectable()
export class AuthService {
    private vault: BarbicanService;
    private db: DB;
    private jwt: JwtService;
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly configService: ConfigService<AppConfig>,
        private readonly dbService: DbService,
        private readonly barbicanService: BarbicanService,
        private readonly JwtService: JwtService
    ) {
        this.vault = barbicanService;
        this.db = dbService.db;
        this.jwt = JwtService;
    }

    public async createUserWithPassword(email: string, newUser: NewUser) {
        const encryptedPassword = sql`crypt(${newUser.encryptedPassword}, gen_salt('bf'))`;

        try {
            const data = await this.db.transaction(async (tx) => {
                const data = await tx
                    .insert(users)
                    .values({
                        ...newUser,
                        encryptedPassword,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning({ id: users.id });

                await tx.execute(sql.raw(`SET SESSION app.user_id = '${data[0].id}'`));

                const identity = await tx
                    .select()
                    .from(identities)
                    .where(eq(identities.userId, data[0].id));

                if (!identity[0]) {
                    await tx.insert(identities).values({
                        userId: data[0].id,
                        provider: "emailpass",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                return data;
            });
            return data[0];
        } catch (error) {
            throw new HttpException('Error creating user', 500);
        }
    }


    private async _createUserSession(userId: string) {
        let session;
        try {
            session = await this.db
                .insert(sessions)
                .values({
                    userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning({ id: sessions.id });
        } catch (error) {
            this.logger.error('Error creating session: ', error);
            throw new HttpException('Error creating session', 500);
        }

        if (!session[0]) {
            this.logger.error('No session created');
            throw new HttpException('Error creating session', 500);
        }

        const token = await this.jwt.signAsync({
            userId: userId,
            sessionId: session[0].id,
            exp: 60 * 15, // 15 minutes
            iat: Number(new Date().toISOString()),
        });

        let refreshToken;
        try {
            refreshToken = await this.jwt.signAsync({
                userId: userId,
                sessionId: session[0].id,
                exp: Number(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
                iat: Number(new Date().toISOString()),
            });

            await this.db
                .insert(refreshTokens)
                .values({
                    userId,
                    token: refreshToken,
                    sessionId: session[0].id,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    revoked: false,
                });
        } catch (error) {
            this.logger.error('Error creating refresh token', error);
            throw new HttpException('Error creating refresh token', 500);
        }

        return { token, refreshToken };
    }

    private async _revokeRefreshToken(refreshToken: string) {
        try {
            await this.db.transaction(async (tx) => {
                // Need to set the role to postgres to have permission to delete
                await tx.execute(sql.raw(`SET ROLE postgres`));
                await tx
                    .delete(refreshTokens)
                    .where(eq(refreshTokens.token, refreshToken));
            });
        } catch (e) {
            this.logger.error('Error revoking refresh token', e);
            throw new HttpException('Error revoking refresh token', 500);
        }
    }

    public async refreshToken(refreshToken: string) {
        let sessionId;
        try {
            sessionId = await this.jwt.verify(refreshToken, {
                secret: this.configService.get('jwtSecret'),
            }).sessionId;


        } catch (e) {
            this.logger.error('Error verifying refresh token', e);
            throw new HttpException('Invalid refresh token', 401);
        }

        try {
            const tokenRecord = await this.db.select()
                .from(refreshTokens)
                .where(and(
                    eq(refreshTokens.token, refreshToken),
                    eq(refreshTokens.revoked, false),
                    sql`expires_at > now()`
                ))
                .limit(1);

            if (!tokenRecord[0]) {
                this.logger.error(`Refresh token not found or revoked: ${refreshToken}`);
                throw new HttpException('Invalid refresh token', 401);
            }
        } catch (e) {
            throw new HttpException('Invalid refresh token', 401);
        }

        let record;
        try {
            record = await this.db.select()
                .from(sessions)
                .where(eq(sessions.id, sessionId))
                .limit(1);
        } catch (e) {
            throw new HttpException('Error refreshing token', 500);
        }

        if (!record[0]) {
            this.logger.error(`No session with id ${sessionId} found for refresh token`);
            throw new HttpException('Invalid refresh token', 401);
        }

        await this._revokeRefreshToken(refreshToken);
        return this._createUserSession(record[0].userId);
    }

    public async signInWithPassword(email: string, password: string) {
        let user;
        try {
            user = await this.db.select()
                .from(users)
                .where(and(eq(users.email, email),
                    sql`encrypted_password = crypt(${password}, encrypted_password)`))
                .limit(1);
        } catch (error) {
            throw new HttpException('Error signing in', 500);
        }

        if (!user[0]) {
            throw new HttpException('Invalid email or password', 401);
        }

        try {
            await this.db.transaction(async (tx) => {
                await tx.execute(sql.raw(`SET SESSION app.user_id = '${user[0].id}'`));
            });
        } catch (error) {
            throw new HttpException('Error setting user context', 500);
        }

        return this._createUserSession(user[0].id);
    }

    public async generateResetPasswordToken(email: string) {
        let data;
        try {
            data = await this.db.select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);
        } catch (e) {
            throw new HttpException('Error generating reset password token', 500);
        }

        if (!data[0]) {
            throw new HttpException('User not found', 404);
        }

        const { id } = data;

        const payload = {
            userId: id,
            exp: Number(Date.now() + 1000 * 60 * 60 * 24)
        };

        let token;

        try {
            token = await this.jwt.signAsync(payload);
        } catch (e) {
            throw new HttpException('Error generating reset password token', 500);
        }

        try {
            await this.vault.createPasswordResetToken(token, id);
        } catch (e) {
            throw new HttpException('Error storing reset password token', 500);
        }

        // NOTE: In prod this should send an email but we are ignoring that for now.
        return token;
    }

    public async resetPassword(token: string, newPassword: string) {
        let payload;

        try {
            payload = this.jwt.verify(token);
        } catch (e) {
            throw new HttpException('Invalid or expired token', 401);
        }
        const { userId } = payload;

        try {
            await this.db
                .update(users)
                .set({
                    encryptedPassword: sql`crypt(${newPassword}, gen_salt('bf'))`,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, userId));
        } catch (e) {
            throw new HttpException('Error resetting password', 500);
        }

        try {
            await this.vault.markPasswordResetTokenUsed(token, userId);
        } catch (e) {
            throw new HttpException(e.message, e.status || 500);
        }
    }
}
