import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { AppConfig } from '@config/constants';
import { InfraModule } from '@infra/infra.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@infra/db/entity/user/user';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('jwtSecret'),
      }),
      inject: [ConfigService],
    }),
    InfraModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [MeService],
  controllers: [MeController],
})
export class MeModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(MeController);
  }
}
