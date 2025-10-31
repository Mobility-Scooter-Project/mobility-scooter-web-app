import { Test, TestingModule } from '@nestjs/testing';
import { KvService } from './kv.service';
import { ConfigModule } from '@nestjs/config';
import config from '@config/constants';

describe('KvService', () => {
  let service: KvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
      ],
      providers: [KvService],
    }).compile();

    service = module.get<KvService>(KvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a kv property', () => {
    expect(service.kv).toBeDefined();
  });
});
