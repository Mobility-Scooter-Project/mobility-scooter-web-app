import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { SessionsController } from './sessions/sessions.controller';
import { InvitesController } from './invites/invites.controller';
import { AssignmentsController } from './assignments/assignments.controller';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { UnitsService } from './units.service';

@Module({
  controllers: [
    UnitsController,
    SessionsController,
    InvitesController,
    AssignmentsController,
  ],
  imports: [UsersModule, JwtModule],
  providers: [UnitsService],
})
export class UnitsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes(UnitsController);
  }
}
