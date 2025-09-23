import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { SessionsController } from './sessions/sessions.controller';
import { InvitesController } from './invites/invites.controller';

@Module({
  controllers: [UnitsController, SessionsController, InvitesController]
})
export class UnitsModule {}
