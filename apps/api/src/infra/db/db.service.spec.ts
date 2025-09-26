import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from './db.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '../../config';
import { User } from './entity/user/user';

describe('DbService', () => {
  let service: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
      ],
      providers: [{
        provide: DbService,
        useFactory: async (configService: ConfigService) => await DbService.build(configService),
        inject: [ConfigService],
      }, ConfigService],
    }).compile();

    service = module.get<DbService>(DbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
