import { HttpException, Injectable } from '@nestjs/common';
import { DbService } from '@infra/db/db.service';
import { BarbicanService } from '@infra/openstack/barbican/barbican.service';
import * as OTPAuth from 'otpauth';
import { Repository } from 'typeorm';
import { User } from '@src/infra/db/entity/user/user';

@Injectable()
export class OtpService {
  private vault: BarbicanService;
  private db: DbService;

  public userRepository: Repository<User>;

  constructor(
    private readonly dbService: DbService,
    private readonly BarbicanService: BarbicanService,
  ) {
    this.vault = BarbicanService;
    this.db = dbService;
  }

  private async _getUserEmailById(userId: string): Promise<string> {
    let data;
    try {
      data = await this.userRepository.findOne({
        where: { id: userId },
        select: ['email'],
      });
    } catch (error) {
      throw new HttpException('Error fetching user email', 500);
    }

    if (!data || !data.email) {
      throw new HttpException('User email not found', 404);
    }

    return data.email;
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
