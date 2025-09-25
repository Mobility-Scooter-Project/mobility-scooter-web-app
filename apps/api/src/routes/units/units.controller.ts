import { Controller, Get, Param, Patch } from '@nestjs/common';

@Controller('units')
export class UnitsController {
  @Get(':unitId/users')
  async getUsers(@Param('unitId') unitId: string) {
    // TODO
  }

  @Patch(':unitId/:userId')
  async updateUserProfile(
    @Param('unitId') unitId: string,
    @Param('userId') userId: string,
  ) {
    // TODO
  }
}
