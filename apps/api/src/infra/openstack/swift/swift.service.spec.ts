import { Test, TestingModule } from '@nestjs/testing';
import { SwiftService } from './swift.service';

describe('SwiftService', () => {
  let service: SwiftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwiftService],
    }).compile();

    service = module.get<SwiftService>(SwiftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
