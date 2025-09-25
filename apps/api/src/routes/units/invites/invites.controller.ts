import { Controller, Post } from '@nestjs/common';

@Controller('units/:unitId/invites')
export class InvitesController {
  @Post()
  async createInvite() {
    // TODO
  }

  @Post(':inviteToken')
  async acceptInvite() {
    // TODO
  }
}
