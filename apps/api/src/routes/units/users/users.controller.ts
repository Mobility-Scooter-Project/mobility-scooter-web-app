import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './users.dto';

@Controller('units/:unitId/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put(':userId')
  public async updateUserById(
    @Param('unitId') unitId: string,
    @Param('userId') userId: string,
    @Body() updateData: UpdateUserDto, // Exclude passwordHash from being updated here
  ) {
    return await this.usersService.updateById(userId, unitId, updateData);
  }

  @Delete(':userId')
  public async deleteUserById(
    @Param('unitId') unitId: string,
    @Param('userId') userId: string,
  ) {
    return await this.usersService.deleteById(userId, unitId);
  }

  @Get('/')
  public async getUsersByUnitId(@Param('unitId') unitId: string) {
    return await this.usersService.getByUnitId(unitId);
  }
}
