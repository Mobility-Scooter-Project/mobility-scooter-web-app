import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db/db.service';
import { KvService } from './kv/kv.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue/queue.service';
import { OpenstackModule } from './openstack/openstack.module';
import config from './config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [config],
  }), OpenstackModule],
  controllers: [AppController],
  providers: [AppService, DbService, KvService, {
    provide: QueueService,
    useFactory: async (configService) => {
      return await QueueService.build(configService);
    },
    inject: [ConfigService],
  }],
})
export class AppModule { }
