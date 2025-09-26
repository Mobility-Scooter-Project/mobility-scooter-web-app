import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InfraModule } from '../infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import { OrgsModule } from './orgs/orgs.module';
import { MeModule } from './me/me.module';
import { VideosModule } from './videos/videos.module';
import config, { AppConfig } from '@config/constants';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        type: 'postgres',
        host: configService.get('database').host,
        port: configService.get('database').port,
        username: configService.get('database').user,
        password: configService.get('database').password,
        database: configService.get('database').database,
        entities: [__dirname + '/../infra/db/entity/**/*.{js,ts}'],
        synchronize: configService.get('environment') !== 'production',
      }),
    }),
    InfraModule,
    AuthModule,
    UnitsModule,
    OrgsModule,
    MeModule,
    VideosModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
