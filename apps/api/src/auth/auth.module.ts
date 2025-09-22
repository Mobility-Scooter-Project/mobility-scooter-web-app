import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  providers: [AuthService],
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get("jwtSecret"),
      }),
      inject: [ConfigService],
    }),
    InfraModule
  ]
})
export class AuthModule { }
