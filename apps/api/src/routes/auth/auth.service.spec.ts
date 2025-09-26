import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import config from '@config/constants';
import { InfraModule } from '@infra/infra.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { createMock } from '@golevelup/ts-jest';
import { USER_ROLES } from '@src/infra/db/entity/user/enums';
import { Unit } from '@src/infra/db/entity/unit/unit';
import { BarbicanService } from '@src/infra/openstack/barbican/barbican.service';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@src/infra/db/entity/user/user';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';

describe('AuthService', () => {
  let service: AuthService;
  let db: DataSource;
  let vault: BarbicanService;
  let jwt: JwtService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;

  let mockUser = {
    email: 'test@example.com',
    password: 'securePassword123',
  };
  let unit: Unit;

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
      providers: [AuthService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<AuthService>(AuthService);
    db = module.get<DataSource>(DataSource);
    jwt = module.get<JwtService>(JwtService);
    vault = module.get<BarbicanService>(BarbicanService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    unit = db.getRepository(Unit).create({ name: 'Test Unit' });

    jest.spyOn(jwt, 'sign').mockReturnValue('signed-token');
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'test-user-id' });

    jest
      .spyOn(service as any, '_createUserSession')
      .mockResolvedValue({ token: 'token', refreshToken: 'refreshToken' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserWithPassword', () => {
    it('should create a user with password', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      jest.spyOn(db, 'transaction').mockImplementation(async (cb) => {
        return {
          id: 'user-id',
          email: mockUser.email,
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit,
        };
      });

      const newUser = await service.createUserWithPassword(
        mockUser.email,
        mockUser.password,
        {
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit,
        },
      );

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe(mockUser.email);
    });
  });

  describe('refreshToken', () => {
    it('should refresh a token', async () => {
      jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue({
        user: { id: 'test-user-id' },
      } as any);
      jest
        .spyOn(refreshTokenRepository, 'save')
        .mockResolvedValue({ token: 'refreshToken' } as any);
      jest
        .spyOn(refreshTokenRepository, 'remove')
        .mockResolvedValue(true as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        givenName: 'Test',
        surname: 'User',
        role: USER_ROLES.RESEARCHER,
        unit,
      } as any);

      const result = await service.refreshToken('valid-refresh-token');
      expect(result).toEqual({ token: 'token', refreshToken: 'refreshToken' });
    });
  });

  describe('signInWithPassword', () => {
    it('should sign in a user with password', async () => {
      const passwordHash =
        '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-id',
        email: mockUser.email,
        passwordHash,
        givenName: 'Test',
        surname: 'User',
        role: USER_ROLES.RESEARCHER,
        unit,
      } as any);

      db.query = jest.fn().mockResolvedValue([{ hash: passwordHash }]);

      const result = await service.signInWithPassword(
        mockUser.email,
        mockUser.password,
      );
      expect(result).toEqual({ token: 'token', refreshToken: 'refreshToken' });
    });
  });

  describe('generateResetPasswordToken', () => {
    it('should generate a reset password token', async () => {
      const passwordHash =
        '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-id',
        email: mockUser.email,
        passwordHash,
        givenName: 'Test',
        surname: 'User',
        role: USER_ROLES.RESEARCHER,
        unit,
      } as any);

      const result = await service.generateResetPasswordToken(mockUser.email);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('resetPassword', () => {
    it('should reset a user password', async () => {
      const passwordHash =
        '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-id',
        email: mockUser.email,
        passwordHash,
        givenName: 'Test',
        surname: 'User',
        role: USER_ROLES.RESEARCHER,
        unit,
      } as any);

      jest.spyOn(userRepository, 'save').mockResolvedValue(true as any);
      jest.spyOn(userRepository, 'update').mockResolvedValue(true as any);

      jest.spyOn(db, 'transaction').mockImplementation(async (cb) => {
        return true;
      });

      jest.spyOn(vault, 'markPasswordResetTokenUsed').mockResolvedValue();

      await service.resetPassword('valid-reset-token', 'newSecurePassword123');
    });
  });
});
