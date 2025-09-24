import { Test, TestingModule } from '@nestjs/testing';
import { SwiftService } from './swift.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../../../config';
import { S3Service } from '../s3/s3.service';
import { BarbicanService } from '../barbican/barbican.service';
import { QueueService } from '../../queue/queue.service';
import { KvService } from '../../kv/kv.service';
import { KeystoneService } from '../keystone/keystone.service';

describe('SwiftService', () => {
  let service: SwiftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({
        isGlobal: true,
        load: [config]
      }), HttpModule],
      providers: [S3Service, BarbicanService, QueueService, KvService, KeystoneService, {
        provide: SwiftService,
        useFactory: async (
          configService: ConfigService,
          KvService: KvService,
          KeystoneService: KeystoneService
        ) => {
          const s3 = new S3Service(configService);
          const barbican = new BarbicanService(KeystoneService, KvService);
          const queue = new QueueService(configService);
          return SwiftService.build(configService, s3, barbican, queue);
        },
        inject: [ConfigService, BarbicanService, QueueService, KvService, KeystoneService]
      }],
    }).compile();

    service = module.get<SwiftService>(SwiftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // once again omitting putObjectStream

  describe('generatePresignedUrl', () => {
    let url: string;
    it('should generate a presigned URL for an existing bucket', async () => {
      url = await service.generatePresignedGetUrl('path/test-object.mp4');
      expect(url).toBeDefined();
      expect(url).toContain('http');
    });
  })
});
