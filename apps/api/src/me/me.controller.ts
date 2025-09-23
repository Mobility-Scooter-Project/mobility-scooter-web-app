import { Controller, Get } from '@nestjs/common';

@Controller('me')
export class MeController {
    @Get('logout')
    async logout() {
        // TODO
    }
}
