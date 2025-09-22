import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';

// OpenStack Services
import { KeystoneService } from './openstack/keystone/keystone.service';
import { BarbicanService } from './openstack/barbican/barbican.service';
import { S3Service } from './openstack/s3/s3.service';
import { SwiftService } from './openstack/swift/swift.service';

// Infrastructure Services
import { KvService } from './kv/kv.service';
import { QueueService } from './queue/queue.service';
import { DbService } from './db/db.service';

/**
 * Combined infrastructure module that provides all core infrastructure services:
 * - OpenStack services (Keystone, Barbican, S3, Swift)
 * - Database service (PostgreSQL)
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
    DbService,

    // Queue service with factory
    {
      provide: QueueService,
      useFactory: async (configService: ConfigService) => {
        return await QueueService.build(configService);
      },
      inject: [ConfigService],
    },

    // S3 service with factory
    {
      provide: S3Service,
      useFactory: async (configService: ConfigService) => {
        return await S3Service.build(configService);
      },
      inject: [ConfigService],
    },

    // Barbican service with factory
    {
      provide: BarbicanService,
      useFactory: async (
        configService: ConfigService,
        keystoneService: KeystoneService,
        kvService: KvService,
        httpService: HttpService
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

    // Swift service with factory
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
  exports: [
    // OpenStack services
    KeystoneService,
    BarbicanService,
    S3Service,
    SwiftService,

    // Infrastructure services
    DbService,
    KvService,
    QueueService,
  ],
})
export class InfraModule { }