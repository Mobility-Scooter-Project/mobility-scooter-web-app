import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { AssignmentsController } from './assignments/assignments.controller';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { InvitesModule } from './invites/invites.module';
import { SessionsModule } from './sessions/sessions.module';
import { InfraModule } from '@infra/infra.module';

@Module({
  controllers: [UnitsController, AssignmentsController],
  imports: [
    UsersModule,
    JwtModule,
    InvitesModule,
    SessionsModule,
    InfraModule,
  ],
})
export class UnitsModule {}
