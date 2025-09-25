import { Get, Req, Post, Body, Controller } from '@nestjs/common';
import { TokenDto } from '../auth.dto';
import { OtpService } from './otp.service';

@Controller('auth/mfa')
export class OtpController {
  private otp: OtpService;

  constructor(private readonly otpService: OtpService) {
    this.otp = otpService;
  }

  @Get()
  async getTOTP(@Req() req) {
    return await this.otp.generateOtp(req.local.userId);
  }

  @Post('verify')
  async verifyTOTP(@Req() req, @Body() body: TokenDto) {
    return await this.otp.verifyOtp(req.local.userId, body.token);
  }
}
