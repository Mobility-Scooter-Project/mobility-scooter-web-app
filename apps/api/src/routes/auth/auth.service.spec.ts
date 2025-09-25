import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from '@src/config';
import { InfraModule } from '@infra/infra.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DbService } from '@infra/db/db.service';
import { createMock } from '@golevelup/ts-jest';
import { USER_ROLES } from '@src/infra/db/entity/user/enums';
import { Unit } from '@src/infra/db/entity/unit/unit';
import { BarbicanService } from '@src/infra/openstack/barbican/barbican.service';

describe('AuthService', () => {
  let service: AuthService;
  let db: DbService;
  let vault: BarbicanService;
  let jwt: JwtService;
  let mockUser = {
    email: "test@example.com",
    password: "securePassword123"
  }
  let unit: Unit;

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
      providers: [AuthService]
    }).useMocker(createMock).compile();

    service = module.get<AuthService>(AuthService);
    db = module.get<DbService>(DbService);
    jwt = module.get<JwtService>(JwtService);
    vault = module.get<BarbicanService>(BarbicanService);

    unit = db.dataSource.getRepository(Unit).create({ name: 'Test Unit' });

    jest.spyOn(jwt, 'sign').mockReturnValue('signed-token');
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'test-user-id' });

    jest.spyOn(service as any, '_createUserSession').mockResolvedValue({ token: 'token', refreshToken: 'refreshToken' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserWithPassword', () => {
    it('should create a user with password', async () => {

      service.userRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;

      jest.spyOn(db.dataSource, 'transaction').mockImplementation(async (cb) => {
        return {
          id: 'user-id',
          email: mockUser.email,
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit
        };
      });

      const newUser = await service.createUserWithPassword(mockUser.email, mockUser.password, {
        givenName: "Test",
        surname: "User",
        role: USER_ROLES.RESEARCHER,
        unit
      });

      expect(newUser).toBeDefined();
      expect(newUser.email).toBe(mockUser.email);
    });
  });

  describe('refreshToken', () => {
    it('should refresh a token', async () => {
      service.refreshTokenRepository = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 'test-user-id' } }),
        save: jest.fn().mockResolvedValue({ token: 'refreshToken' }),
        remove: jest.fn().mockResolvedValue(true)
      } as any;


      const result = await service.refreshToken('valid-refresh-token');
      expect(result).toEqual({ token: 'token', refreshToken: 'refreshToken' });
    });
  });

  describe('signInWithPassword', () => {
    it('should sign in a user with password', async () => {
      const passwordHash = '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      service.userRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: mockUser.email,
          passwordHash,
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit
        }),
      } as any;

      db.dataSource.query = jest.fn().mockResolvedValue([{ hash: passwordHash }]);

      const result = await service.signInWithPassword(mockUser.email, mockUser.password);
      expect(result).toEqual({ token: 'token', refreshToken: 'refreshToken' });
    });
  });

  describe('generateResetPasswordToken', () => {
    it('should generate a reset password token', async () => {
      const passwordHash = '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      service.userRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: mockUser.email,
          passwordHash,
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit
        }),
      } as any;

      const result = await service.generateResetPasswordToken(mockUser.email);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('resetPassword', () => {
    it('should reset a user password', async () => {
      const passwordHash = '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H'; // bcrypt hash for 'securePassword123'

      service.userRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: mockUser.email,
          passwordHash,
          givenName: 'Test',
          surname: 'User',
          role: USER_ROLES.RESEARCHER,
          unit
        }),
        save: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true)
      } as any;

      jest.spyOn(db.dataSource, 'transaction').mockImplementation(async (cb) => {
        return true;
      });

      jest.spyOn(vault, 'markPasswordResetTokenUsed').mockResolvedValue();

      await service.resetPassword('valid-reset-token', 'newSecurePassword123');
    });
  });

  afterAll(async () => {
    await db.dataSource.destroy();
  });
});
