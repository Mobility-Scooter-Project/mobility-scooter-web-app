import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InfraModule } from '@infra/infra.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@infra/db/entity/user/user';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { PermissionsMiddleware } from '@src/middleware/permissions/permissions.middleware';
import { JwtModule } from '@nestjs/jwt';
import { RoutePermissions } from '@infra/db/entity/user/route-permissions';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RoutePermissions]),
    JwtModule,
    InfraModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware, PermissionsMiddleware)
      .forRoutes(UsersController);
  }
}
