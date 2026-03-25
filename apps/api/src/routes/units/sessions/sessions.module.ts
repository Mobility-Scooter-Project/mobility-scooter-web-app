import { MiddlewareConsumer, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfraModule } from '@infra/infra.module';
import { PatientSession } from '@infra/db/entity/video/session';
import { Patient } from '@infra/db/entity/unit/patient';
import { User } from '@infra/db/entity/user/user';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([PatientSession, Patient, User]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, UnitAuthorizationService],
})
export class SessionsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(SessionsController);
  }
}
