import { Controller, Get, Put, Req } from '@nestjs/common';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  async getProfile(@Req() req) {
    const id = req.local.userId;
    return await this.meService.getProfile(id);
  }

  @Get('logout')
  async logout() {
    // TODO
  }

  @Put()
  async updateProfile() {
    // TODO
  }
}
