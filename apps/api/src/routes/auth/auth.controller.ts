import { Body, Controller, Get, HttpException, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { seconds, Throttle } from '@nestjs/throttler';
import {
  CompleteJoinOrgDto,
  EmailBodyDto,
  JoinOrgApplicationDto,
  NewPasswordDto,
  SignInWithEmailDto,
  TokenDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';

@Controller('auth')
export class AuthController {
  private auth: AuthService;
  private otp: OtpService;

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {
    this.auth = authService;
    this.otp = otpService;
  }

  @Post('email')
  async signInWithEmail(
    @Body() body: SignInWithEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.auth.signInWithPassword(body.email, body.password, res);
  }

  @Post('email/sign-up/join-org')
  @Throttle({
    default: {
      limit: 3,
      ttl: seconds(300),
    },
  })
  async submitJoinOrgApplication(@Body() body: JoinOrgApplicationDto) {
    return await this.auth.submitJoinOrgApplication(
      body.email,
      body.orgId,
      body.unitId,
      {
        givenName: body.givenName,
        surname: body.surname,
        intendedRole: body.intendedRole,
      },
    );
  }

  @Post('email/sign-up/create-account/preview')
  async previewJoinOrgComplete(@Body() body: TokenDto) {
    return await this.auth.previewJoinOrgComplete(body.token);
  }

  @Post('email/sign-up/create-account/complete')
  async completeJoinOrgApplication(@Body() body: CompleteJoinOrgDto) {
    await this.auth.completeJoinOrgApplication(body.token, body.password);
    return { ok: true };
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
    }

    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    if (!match) {
      throw new HttpException('Refresh token missing', HttpStatus.UNAUTHORIZED);
    }

    const token = decodeURIComponent(match[1]);

    return await this.auth.refreshToken(token, res);
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieHeader = req.headers.cookie;
    const match = cookieHeader?.match(/refreshToken=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : undefined;
    return await this.auth.logout(token, res);
  }

  @Post('email/reset-password/token')
  async sendResetPasswordEmail(@Body() body: EmailBodyDto) {
    return await this.auth.generateResetPasswordToken(body.email);
  }

  @Patch('email/reset-password')
  async resetPassword(@Body() body: NewPasswordDto) {
    return await this.auth.resetPassword(body.token, body.newPassword);
  }
}
