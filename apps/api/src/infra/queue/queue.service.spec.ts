import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import config from '../../config';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({
        isGlobal: true,
        load: [config]
      }), HttpModule],
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a producer', () => {
    const producer = service.getProducer();
    expect(producer).toBeDefined();
  });
});
