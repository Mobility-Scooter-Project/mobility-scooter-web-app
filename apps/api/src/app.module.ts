import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db/db.service';
import { KvModule } from './kv/kv.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue/queue.service';
import { OpenstackModule } from './openstack/openstack.module';
import config from './config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [config],
  }), KvModule, OpenstackModule],
  controllers: [AppController],
  providers: [AppService, DbService, {
    provide: QueueService,
    useFactory: async (configService) => {
      return await QueueService.build(configService);
    },
    inject: [ConfigService],
  }],
  exports: [DbService, QueueService],
})
export class AppModule { }
