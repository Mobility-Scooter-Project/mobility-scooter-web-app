import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLES } from '@config/enums';
import { Unit } from '@src/infra/db/entity/unit/unit';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@src/infra/db/entity/user/user';
import { RefreshToken } from '@src/infra/db/entity/user/refresh-token';
import { MailService } from '@infra/mail/mail.service';
import { KvService } from '@infra/kv/kv.service';
import { ConfigService } from '@nestjs/config';

const mailServiceMock = {
  isConfigured: jest.fn().mockReturnValue(false),
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendJoinOrgCompleteEmail: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;
  let db: DataSource;
  let jwt: JwtService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let unitRepository: Repository<Unit>;
  let kv: { set: jest.Mock; get: jest.Mock; del: jest.Mock; expire: jest.Mock };

  let mockUser = {
    email: 'test@example.com',
    password: 'securePassword123',
  };
  let unit: Unit;

  beforeEach(async () => {
    kv = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    };

    const dbMock = {
      query: jest.fn(),
      transaction: jest.fn(),
    };
    const jwtMock = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
    };
    const userRepositoryMock = {
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const refreshTokenRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    const unitRepositoryMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dbMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: getRepositoryToken(User), useValue: userRepositoryMock },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepositoryMock,
        },
        { provide: getRepositoryToken(Unit), useValue: unitRepositoryMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: KvService, useValue: { kv } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwtSecret') return 'test-jwt-secret';
              if (key === 'webAppUrl') return 'http://localhost:5173';
              if (key === 'environment') return 'test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    db = module.get<DataSource>(DataSource);
    jwt = module.get<JwtService>(JwtService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    unitRepository = module.get<Repository<Unit>>(getRepositoryToken(Unit));
    unit = { id: 'unit-id', name: 'Test Unit' } as Unit;

    mailServiceMock.isConfigured.mockReset();
    mailServiceMock.isConfigured.mockReturnValue(false);
    mailServiceMock.sendVerificationEmail.mockReset();
    mailServiceMock.sendVerificationEmail.mockResolvedValue(undefined);
    mailServiceMock.sendPasswordResetEmail.mockReset();
    mailServiceMock.sendPasswordResetEmail.mockResolvedValue(undefined);
    mailServiceMock.sendJoinOrgCompleteEmail.mockReset();
    mailServiceMock.sendJoinOrgCompleteEmail.mockResolvedValue(undefined);

    jest.spyOn(jwt, 'sign').mockReturnValue('signed-token' as never);
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'test-user-id' } as never);

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
      jest.spyOn(db, 'query').mockResolvedValue([{ hash: 'hashed-password' }] as never);

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

  describe('submitJoinOrgApplication', () => {
    beforeEach(() => {
      mailServiceMock.isConfigured.mockReturnValue(false);
      mailServiceMock.sendVerificationEmail.mockClear();
      mailServiceMock.sendVerificationEmail.mockResolvedValue(undefined);
      mailServiceMock.sendJoinOrgCompleteEmail.mockClear();
      mailServiceMock.sendJoinOrgCompleteEmail.mockResolvedValue(undefined);
    });

    it('returns completeToken when SMTP is not configured', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(unitRepository, 'findOne').mockResolvedValue({
        id: 'unit-id',
        name: 'Test Unit',
        org: { id: 'org-id', name: 'Test Org' },
      } as Unit);

      jest.spyOn(service as any, 'saveJoinOrgApplicantWithoutPassword').mockResolvedValue({
        id: 'new-user-id',
        email: 'join@example.com',
        role: USER_ROLES.RESEARCHER,
      } as User);

      jest.spyOn(jwt, 'signAsync').mockResolvedValue('complete-jwt-token');

      const kv = (service as any).kv as {
        set: jest.Mock;
        expire: jest.Mock;
      };
      jest.spyOn(kv, 'set').mockResolvedValue('OK');
      jest.spyOn(kv, 'expire').mockResolvedValue(1);

      const result = await service.submitJoinOrgApplication(
        'join@example.com',
        'org-id',
        'unit-id',
        { givenName: 'A', surname: 'B' },
      );

      expect(result.completeToken).toBe('complete-jwt-token');
      expect(mailServiceMock.sendJoinOrgCompleteEmail).not.toHaveBeenCalled();
      expect(jwt.signAsync).toHaveBeenCalled();
    });

    it('sends join-org complete email when SMTP is configured', async () => {
      mailServiceMock.isConfigured.mockReturnValue(true);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(unitRepository, 'findOne').mockResolvedValue({
        id: 'unit-id',
        name: 'Test Unit',
        org: { id: 'org-id', name: 'Test Org' },
      } as Unit);

      jest.spyOn(service as any, 'saveJoinOrgApplicantWithoutPassword').mockResolvedValue({
        id: 'new-user-id',
        email: 'join2@example.com',
        role: USER_ROLES.RESEARCHER,
      } as User);

      jest.spyOn(jwt, 'signAsync').mockResolvedValue('complete-jwt-token');

      const kv = (service as any).kv as {
        set: jest.Mock;
        expire: jest.Mock;
      };
      jest.spyOn(kv, 'set').mockResolvedValue('OK');
      jest.spyOn(kv, 'expire').mockResolvedValue(1);

      await service.submitJoinOrgApplication(
        'join2@example.com',
        'org-id',
        'unit-id',
      );

      expect(mailServiceMock.sendJoinOrgCompleteEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'join2@example.com',
          completeUrl: expect.stringContaining(
            '/create-account?token=complete-jwt-token',
          ),
        }),
      );
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
    const passwordHash =
      '$2b$12$KIXQJ4WZ5y3E6b8u1rOeUuG8Fh8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8Hf8H';

    const existingUser = {
      id: 'user-id',
      email: mockUser.email,
      passwordHash,
      givenName: 'Test',
      surname: 'User',
      role: USER_ROLES.RESEARCHER,
      unit,
    } as any;

    it('returns only a generic message when no user exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const kv = (service as any).kv as { set: jest.Mock };
      const setSpy = jest.spyOn(kv, 'set').mockResolvedValue('OK' as any);

      const result = await service.generateResetPasswordToken('missing@example.com');

      expect(result).toEqual({
        message:
          'If an account exists for this email address, we sent password reset instructions.',
      });
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('stores token and returns dev token when user exists and SMTP is off', async () => {
      mailServiceMock.isConfigured.mockReturnValue(false);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);
      const kv = (service as any).kv as { set: jest.Mock; expire: jest.Mock };
      jest.spyOn(kv, 'set').mockResolvedValue('OK' as any);
      jest.spyOn(kv, 'expire').mockResolvedValue(1);

      const result = await service.generateResetPasswordToken(mockUser.email);

      expect(kv.set).toHaveBeenCalledWith(
        'reset_password_token::user-id',
        'signed-token',
      );
      expect(kv.expire).toHaveBeenCalledWith('reset_password_token::user-id', 60 * 15);
      expect(result.token).toBe('signed-token');
      expect(result.message).toContain('If an account exists');
      expect(mailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sends email and omits token when SMTP is on', async () => {
      mailServiceMock.isConfigured.mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);
      const kv = (service as any).kv as { set: jest.Mock; expire: jest.Mock };
      jest.spyOn(kv, 'set').mockResolvedValue('OK' as any);
      jest.spyOn(kv, 'expire').mockResolvedValue(1);

      const result = await service.generateResetPasswordToken(mockUser.email);

      expect(mailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        resetUrl: expect.stringMatching(/reset-password\?token=/),
      });
      expect(result.token).toBeUndefined();
      expect(result.message).toContain('If an account exists');
    });

    it('deletes stored token and throws when sending email fails', async () => {
      mailServiceMock.isConfigured.mockReturnValue(true);
      mailServiceMock.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('smtp down'),
      );
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);
      const kv = (service as any).kv as {
        set: jest.Mock;
        expire: jest.Mock;
        del: jest.Mock;
      };
      jest.spyOn(kv, 'set').mockResolvedValue('OK' as any);
      jest.spyOn(kv, 'expire').mockResolvedValue(1);
      jest.spyOn(kv, 'del').mockResolvedValue(1);

      await expect(
        service.generateResetPasswordToken(mockUser.email),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_GATEWAY });

      expect(kv.del).toHaveBeenCalledWith('reset_password_token::user-id');
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

      jest.spyOn(userRepository, 'update').mockResolvedValue(true as any);
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-id',
        purpose: 'password_reset',
      });
      const kv = (service as any).kv as { get: jest.Mock; del: jest.Mock };
      jest.spyOn(kv, 'get').mockResolvedValue('valid-reset-token');
      jest.spyOn(kv, 'del').mockResolvedValue(1);

      jest.spyOn(db, 'query').mockResolvedValue([{ hash: 'new-hash' }]);

      await service.resetPassword('valid-reset-token', 'newSecurePassword123');

      expect(kv.get).toHaveBeenCalledWith('reset_password_token::user-id');
      expect(userRepository.update).toHaveBeenCalled();
      expect(kv.del).toHaveBeenCalledWith('reset_password_token::user-id');
    });
  });
});
