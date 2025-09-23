import { Body, Controller, Post } from '@nestjs/common';
import { EmailBodyDto, SignInWithEmailDto, TokenDto } from './auth.validators';
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

    @Post('email/reset-password')
    async resetPassword() {
        // TODO
    }
}
