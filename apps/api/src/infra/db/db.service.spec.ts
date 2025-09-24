import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from './db.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../../config';

describe('DbService', () => {
  let service: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({
        isGlobal: true,
        load: [config]
      })],
      providers: [DbService],

    }).compile();

    service = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a db property', () => {
    expect(service.db).toBeDefined();
  });
});
