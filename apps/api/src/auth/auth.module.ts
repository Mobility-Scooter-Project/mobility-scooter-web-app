import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { InfraModule } from 'src/infra/infra.module';
import { OtpService } from './otp/otp.service';
import { AuthController } from './auth.controller';

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
  controllers: [AuthController]
})
export class AuthModule { }
