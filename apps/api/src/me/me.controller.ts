import { Controller, Get, Put } from '@nestjs/common';

@Controller('me')
export class MeController {
    @Get('logout')
    async logout() {
        // TODO
    }

    @Put()
    async updateProfile() {
        // TODO
    }
}
