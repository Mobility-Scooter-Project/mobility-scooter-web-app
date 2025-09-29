import { Test, TestingModule } from '@nestjs/testing';
import { MeService } from './me.service';
import { Repository } from 'typeorm';
import { User } from '@infra/db/entity/user/user';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { InfraModule } from '@infra/infra.module';
import { createMock } from '@golevelup/ts-jest';
import { RefreshToken } from '@infra/db/entity/user/refresh-token';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import config from '@config/constants';

describe('MeService', () => {
  let service: MeService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        InfraModule,
        JwtModule,
        TypeOrmModule.forFeature([User, RefreshToken]),
      ],
      providers: [MeService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<MeService>(MeService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = '12345';
      const mockProfile = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        phoneNumber: '1234567890',
        title: 'Mr.',
        role: 'admin',
        city: 'Test City',
      };
      userRepo.findOne = jest.fn().mockResolvedValue(mockProfile);

      const profile = await service.getProfile(userId);

      expect(profile).toEqual(mockProfile);
    });
  });
});
