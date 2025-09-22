import { Test, TestingModule } from '@nestjs/testing';
import { BarbicanService } from './barbican.service';

describe('BarbicanService', () => {
  let service: BarbicanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarbicanService],
    }).compile();

    service = module.get<BarbicanService>(BarbicanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
