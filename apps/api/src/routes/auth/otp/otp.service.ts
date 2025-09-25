import { HttpException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, DbService } from '@/infra/db/db.service';
import { users } from '@/infra/db/schema/auth';
import { BarbicanService } from '@/infra/openstack/barbican/barbican.service';
import * as OTPAuth from 'otpauth';

@Injectable()
export class OtpService {
  private vault: BarbicanService;
  private db: DB;

  constructor(
    private readonly dbService: DbService,
    private readonly BarbicanService: BarbicanService,
  ) {
    this.vault = BarbicanService;
    this.db = dbService.db;
  }

  private async _getUserEmailById(userId: string): Promise<string> {
    let data;
    try {
      data = await this.db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    } catch (error) {
      throw new HttpException('Error fetching user email', 500);
    }

    if (!data[0] || !data[0].email) {
      throw new HttpException('User email not found', 404);
    }

    return data[0].email;
  }

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
      await this.vault.createOtpSecret(userId, secret);
    } catch (error) {
      throw new HttpException('Error storing OTP secret', 500);
    }

    return { url: totp.toString(), secret };
  }

  public async verifyOtp(userId: string, token: string): Promise<boolean> {
    const email = await this._getUserEmailById(userId);
    const secret = await this.vault.getOtpSecretByUserId(userId);

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
