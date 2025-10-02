import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { InviteDto } from './invites.dto';
import { InvitesService } from './invites.service';

@Controller('units')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post(':unitId/invite')
  async createInvite(
    @Req() req,
    @Param('unitId') unitId: string,
    @Body() body: InviteDto,
  ) {
    return await this.invitesService.createInvite(
      unitId,
      req.locals.userId,
      body.role,
      body.email,
    );
  }

  @Post('invites/:inviteToken')
  async acceptInvite(@Param('inviteToken') inviteToken: string) {
    return await this.invitesService.acceptInvite(inviteToken);
  }
}
