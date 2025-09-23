import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { InfraModule } from 'src/infra/infra.module';
import { OtpService } from './otp/otp.service';
import { AuthController } from './auth.controller';
import { JwtMiddleware } from 'src/jwt/jwt.middleware';
import { OtpController } from './otp/otp.controller';

@Module({
  providers: [AuthService, OtpService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get("jwtSecret"),
      }),
      inject: [ConfigService],
    }),
    InfraModule
  ],
  controllers: [AuthController, OtpController]
})

export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(OtpController);
  }
}
