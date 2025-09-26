import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { KeystoneService } from './openstack/keystone/keystone.service';
import { BarbicanService } from './openstack/barbican/barbican.service';
import { S3Service } from './openstack/s3/s3.service';
import { SwiftService } from './openstack/swift/swift.service';
import { KvService } from './kv/kv.service';
import { QueueService } from './queue/queue.service';

/**
 * Combined infrastructure module that provides all core infrastructure services:
 * - OpenStack services (Keystone, Barbican, S3, Swift)
 * - Key-Value store (Redis)
 * - Message Queue (Kafka)
 *
 * This module consolidates what were previously separate modules (OpenstackModule, KvModule)
 * and includes queue and database services for a unified infrastructure layer.
 */
@Module({
  imports: [HttpModule],
  providers: [
    // Basic services
    KeystoneService,
    KvService,
    {
      provide: QueueService,
      useFactory: async (configService: ConfigService) => {
        return await QueueService.build(configService);
      },
      inject: [ConfigService],
    },
    S3Service,
    SwiftService,
    {
      provide: BarbicanService,
      useFactory: async (
        configService: ConfigService,
        keystoneService: KeystoneService,
        kvService: KvService,
        httpService: HttpService,
      ) => {
        return await BarbicanService.build(
          configService,
          keystoneService,
          kvService,
          httpService,
        );
      },
      inject: [ConfigService, KeystoneService, KvService, HttpService],
    },
  ],
  exports: [
    KeystoneService,
    BarbicanService,
    S3Service,
    SwiftService,
    KvService,
    QueueService,
  ],
})
export class InfraModule {}
