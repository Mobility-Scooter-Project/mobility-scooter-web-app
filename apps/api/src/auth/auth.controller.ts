import { Body, Controller, Patch, Post } from '@nestjs/common';
import { EmailBodyDto, NewPasswordDto, SignInWithEmailDto, TokenDto } from './auth.validators';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    private auth: AuthService;

    constructor(
        private readonly authService: AuthService
    ) {
        this.auth = authService;
    }

    @Post('email')
    async signInWithEmail(@Body() body: SignInWithEmailDto) {
        return await this.auth.signInWithPassword(body.email, body.password);
    }

    @Post('refresh-token')
    async refreshToken(@Body() body: TokenDto) {
        return await this.auth.refreshToken(body.token);
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
