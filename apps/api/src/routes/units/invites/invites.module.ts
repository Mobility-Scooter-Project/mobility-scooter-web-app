import { RoutePermissions } from '@infra/db/entity/user/route-permissions';
import { User } from '@infra/db/entity/user/user';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { PermissionsMiddleware } from '@src/middleware/permissions/permissions.middleware';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { Unit } from '@infra/db/entity/unit/unit';
import { InfraModule } from '@infra/infra.module';
import { UnitInvite } from '@infra/db/entity/unit/invite';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RoutePermissions, Unit, UnitInvite]),
    JwtModule,
    InfraModule,
  ],
  providers: [InvitesService],
  controllers: [InvitesController],
})
export class InvitesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware, PermissionsMiddleware)
      .exclude({
        path: 'units/invites/{*splat}', // Adjusted path
        method: RequestMethod.POST,
      })
      .forRoutes(InvitesController);
  }
}
