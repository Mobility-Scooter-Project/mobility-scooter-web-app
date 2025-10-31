import {
  Controller,
  Get,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MeService } from './me.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  async getProfile(@Req() req) {
    const id = req.locals.userId;
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

  @Put('pfp')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const id = req.locals.userId;
    return await this.meService.uploadProfilePicture(id, file);
  }
}
