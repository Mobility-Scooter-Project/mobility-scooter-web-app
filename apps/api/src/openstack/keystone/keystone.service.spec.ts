import { Test, TestingModule } from '@nestjs/testing';
import { KeystoneService } from './keystone.service';

describe('KeystoneService', () => {
  let service: KeystoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeystoneService],
    }).compile();

    service = module.get<KeystoneService>(KeystoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
