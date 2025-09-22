import { Module } from '@nestjs/common';
import { KeystoneService } from './keystone/keystone.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { BarbicanService } from './barbican/barbican.service';
import { ConfigService } from '@nestjs/config';
import { KvService } from 'src/kv/kv.service';
import { KvModule } from 'src/kv/kv.module';
import { SwiftService } from './swift/swift.service';
import { S3Service } from './s3/s3.service';
import { QueueService } from 'src/queue/queue.service';

@Module({
  imports: [HttpModule, KvModule],
  providers: [
    KeystoneService,
    {
      provide: QueueService,
      useFactory: async (configService: ConfigService) => {
        return await QueueService.build(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: S3Service,
      useFactory: async (configService: ConfigService) => {
        return await S3Service.build(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: BarbicanService,
      useFactory: async (
        configService,
        keystoneService: KeystoneService,
        kvService,
        httpService
      ) => {
        return await BarbicanService.build(
          configService,
          keystoneService,
          kvService,
          httpService
        );
      },
      inject: [ConfigService, KeystoneService, KvService, HttpService],
    },
    {
      provide: SwiftService,
      useFactory: async (
        configService: ConfigService,
        s3Service: S3Service,
        barbicanService: BarbicanService,
        queueService: QueueService,
      ) => {
        return await SwiftService.build(
          configService,
          s3Service,
          barbicanService,
          queueService
        );
      },
      inject: [ConfigService, S3Service, BarbicanService, QueueService],
    },
  ],
  exports: [KeystoneService, BarbicanService, S3Service, SwiftService, QueueService],
})

export class OpenstackModule { }
