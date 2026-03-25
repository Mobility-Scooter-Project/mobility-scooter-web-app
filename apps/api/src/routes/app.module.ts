import { ExecutionContext, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InfraModule } from '../infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import { OrgsModule } from './orgs/orgs.module';
import { MeModule } from './me/me.module';
import { VideosModule } from './videos/videos.module';
import { VideoWorkerModule } from './video-worker/video-worker.module';
import config, { AppConfig } from '@config/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { KvService } from '@infra/kv/kv.service';

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
    ThrottlerModule.forRootAsync({
      imports: [InfraModule],
      inject: [KvService],
      useFactory: async (KvService: KvService) => ({
        throttlers: [{ limit: 5, ttl: seconds(60) }],
        storage: new ThrottlerStorageRedisService(KvService.kv),
        skipIf: (context: ExecutionContext) => {
          return process.env.ENVIRONMENT !== 'production';
        },
      }),
    }),
    InfraModule,
    AuthModule,
    UnitsModule,
    OrgsModule,
    MeModule,
    VideosModule,
    VideoWorkerModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
