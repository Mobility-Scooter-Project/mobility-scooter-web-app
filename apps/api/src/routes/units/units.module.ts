import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { SessionsController } from './sessions/sessions.controller';
import { InvitesController } from './invites/invites.controller';
import { AssignmentsController } from './assignments/assignments.controller';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { InvitesService } from './invites/invites.service';
import { InvitesModule } from './invites/invites.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@infra/db/entity/user/user';
import { InfraModule } from '@infra/infra.module';
import { UnitInvite } from '@infra/db/entity/unit/invite';

@Module({
  controllers: [
    UnitsController,
    SessionsController,
    InvitesController,
    AssignmentsController,
  ],
  imports: [
    UsersModule,
    JwtModule,
    InvitesModule,
    InfraModule,
    TypeOrmModule.forFeature([User, UnitInvite]),
  ],
  providers: [InvitesService],
})
export class UnitsModule {}
