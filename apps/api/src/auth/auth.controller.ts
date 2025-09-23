import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    @Post('email')
    async signInWithEmail() {
        // TODO
    }

    @Post('email/reset-password/token')
    async sendResetPasswordEmail() {
        // TODO
    }

    @Post('email/reset-password')
    async resetPassword() {
        // TODO
    }
}
