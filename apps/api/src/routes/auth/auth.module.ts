import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { InfraModule } from '@src/infra/infra.module';
import { OtpService } from './otp/otp.service';
import { AuthController } from './auth.controller';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { OtpController } from './otp/otp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/infra/db/entity/user/user';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';
import { Unit } from '@src/infra/db/entity/unit/unit';

@Module({
  providers: [AuthService, OtpService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('jwtSecret'),
      }),
      inject: [ConfigService],
    }),
    InfraModule,
    TypeOrmModule.forFeature([User, RefreshToken, Unit]),
  ],
  controllers: [AuthController, OtpController],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(OtpController);
  }
}
