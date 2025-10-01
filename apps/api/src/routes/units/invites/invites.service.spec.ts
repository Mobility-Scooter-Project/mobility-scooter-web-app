import { Test, TestingModule } from '@nestjs/testing';
import { InvitesService } from './invites.service';
import { createMock } from '@golevelup/ts-jest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@infra/db/entity/user/user';
import { UnitInvite } from '@infra/db/entity/unit/invite';
import { INVITE_STATUS, USER_ROLES } from '@config/enums';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('InvitesService', () => {
  let service: InvitesService;
  let userRepository: Repository<User>;
  let inviteRepository: Repository<UnitInvite>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([User, UnitInvite])],
      providers: [InvitesService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<InvitesService>(InvitesService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    inviteRepository = module.get<Repository<UnitInvite>>(
      getRepositoryToken(UnitInvite),
    );
    jwtService = module.get<JwtService>(JwtService);

    jest.spyOn(jwtService, 'signAsync').mockResolvedValue('mocked-jwt-token');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvite', () => {
    it('should create an invite and return a token', async () => {
      // Mock data
      const unitId = 'unit123';
      const userId = 'user123';
      const role = USER_ROLES.TRAINEE;
      const email = 'test@example.com';

      // Mock user
      const mockUser = {
        id: userId,
        unit: { id: unitId },
      } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      inviteRepository.save = jest
        .fn()
        .mockResolvedValue({ id: 'invite123' } as UnitInvite);

      const result = await service.createInvite(unitId, userId, role, email);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: userId,
          unit: { id: unitId },
        },
      });
      expect(inviteRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('token', 'mocked-jwt-token');
    });
  });

  describe('acceptInvite', () => {
    it('should accept an invite and return the user', async () => {
      // Mock data
      const token = 'valid-token';
      const userId = 'user123';
      const unitId = 'unit123';

      // Mock invite
      const mockInvite = {
        id: 'invite123',
        email: 'test@example.com',
        unit: { id: unitId, name: 'Test Unit' } as any,
        role: USER_ROLES.TRAINEE,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
        status: INVITE_STATUS.PENDING,
      } as Partial<UnitInvite>;

      // Mock user
      const mockUser = {
        id: userId,
        unit: null,
        role: null,
      } as unknown as User;

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({
          id: mockInvite.id,
          unitId,
          role: USER_ROLES.TRAINEE,
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
      jest
        .spyOn(inviteRepository, 'findOne')
        .mockResolvedValue(mockInvite as UnitInvite);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue({
          ...mockUser,
          unit: { id: unitId } as any,
          role: USER_ROLES.TRAINEE,
        });
      jest
        .spyOn(inviteRepository, 'delete')
        .mockResolvedValue({ affected: 1, raw: [] });

      await service.acceptInvite(token);
    });
  });
});
