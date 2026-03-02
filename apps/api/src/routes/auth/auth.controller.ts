import { Body, Controller, Get, HttpException, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  EmailBodyDto,
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

  @Post('email/reset-password/token')
  async sendResetPasswordEmail(@Body() body: EmailBodyDto) {
    return await this.auth.generateResetPasswordToken(body.email);
  }

  @Patch('email/reset-password')
  async resetPassword(@Body() body: NewPasswordDto) {
    return await this.auth.resetPassword(body.token, body.newPassword);
  }
}
