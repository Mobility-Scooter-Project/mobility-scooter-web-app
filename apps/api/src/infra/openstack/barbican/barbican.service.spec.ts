import { Test, TestingModule } from '@nestjs/testing';
import { BarbicanService } from './barbican.service';
import { KeystoneService } from '../keystone/keystone.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../../../config';
import { KvService } from '../../kv/kv.service';
import { HttpModule, HttpService } from '@nestjs/axios';

describe('BarbicanService', () => {
  let service: BarbicanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        HttpModule,
      ],
      providers: [
        KeystoneService,
        KvService,
        {
          provide: BarbicanService,
          useFactory: async (
            configService: ConfigService,
            keystone: KeystoneService,
            kv: KvService,
            httpService: HttpService,
          ) =>
            await BarbicanService.build(
              configService,
              keystone,
              kv,
              httpService,
            ),
          inject: [ConfigService, KeystoneService, KvService, HttpService],
        },
      ],
    })
      .useMocker((token) => {
        if (token === BarbicanService) {
          return {};
        }
      })
      .compile();

    service = module.get<BarbicanService>(BarbicanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // These tests are technically integration tests since they hit real OpenStack services, but mocking HTTP calls is too complex for now.
  it('should upsert a secret', async () => {
    await service.upsertSecret('test/path', 'test-key', 'test-secret');
  });

  it('should get a secret', async () => {
    const secret = await service.readSecret('test/path', 'test-key');
    expect(secret).toBe('test-secret');
  });

  // The other methods are ommitted as they are wrappers around the above methods.
});
