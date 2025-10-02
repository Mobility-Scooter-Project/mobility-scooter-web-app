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
import { Readable } from 'stream';
import { SwiftService } from '@infra/openstack/swift/swift.service';

describe('MeService', () => {
  let service: MeService;
  let userRepo: Repository<User>;
  let swiftService: SwiftService;

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
    swiftService = module.get<SwiftService>(SwiftService);
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

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const userId = '12345';
      const updateData = {
        name: 'Updated User',
        phoneNumber: '0987654321',
        title: 'Ms.',
        city: 'Updated City',
      };
      const updatedProfile = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
        role: 'admin',
      };

      userRepo.update = jest.fn().mockResolvedValue(undefined);
      userRepo.findOne = jest.fn().mockResolvedValue(updatedProfile);

      const profile = await service.updateProfile(userId, updateData);

      expect(userRepo.update).toHaveBeenCalledWith({ id: userId }, updateData);
      expect(profile).toEqual(updatedProfile);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should upload profile picture', async () => {
      const userId = '12345';
      const file = {
        originalname: 'profile.jpg',
        buffer: Buffer.from('test image data'),
      } as Express.Multer.File;

      const putObjectStreamMock = jest
        .spyOn(swiftService, 'putObjectStream')
        .mockResolvedValue();

      await service.uploadProfilePicture(userId, file);

      expect(putObjectStreamMock).toHaveBeenCalledWith(
        `users/${userId}/profile/${file.originalname}`,
        expect.any(Readable),
      );
    });
  });
});
