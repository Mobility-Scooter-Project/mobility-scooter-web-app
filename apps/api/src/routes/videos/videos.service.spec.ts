import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { InfraModule } from '@/infra/infra.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import config from '@/config';

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        InfraModule,
        JwtModule
      ],
      providers: [VideosService],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
