import { Test, TestingModule } from '@nestjs/testing';
import { BarbicanService } from './barbican.service';
import { KeystoneService } from '../keystone/keystone.service';
import { ConfigModule } from '@nestjs/config';
import config from '../../../config';
import { KvService } from '../../kv/kv.service';
import { HttpModule } from '@nestjs/axios';

describe('BarbicanService', () => {
  let service: BarbicanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({
        isGlobal: true,
        load: [config]
      }), HttpModule],
      providers: [BarbicanService, KeystoneService, KvService],
    }).useMocker((token) => {
      if(token === BarbicanService) {
        return {
          
        }
      }
    }).compile();

    service = module.get<BarbicanService>(BarbicanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upsert a secret', async () => {
    const result = await service.upsertSecret("test/path", "test-key", "test-secret");
  })
});
