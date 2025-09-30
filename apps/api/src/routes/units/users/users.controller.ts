import { Body, Controller, Param, Put } from '@nestjs/common';
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
}
