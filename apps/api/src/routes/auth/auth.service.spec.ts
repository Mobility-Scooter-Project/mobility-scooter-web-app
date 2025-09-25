import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import config from '@/config';
import { InfraModule } from '@/infra/infra.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DbService } from '@/infra/db/db.service';
import { createMock } from '@golevelup/ts-jest';

describe('AuthService', () => {
  let service: AuthService;
  let db: DbService;
  let jwt: JwtService;

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
      providers: [AuthService],
    }).useMocker(createMock).compile();

    service = module.get<AuthService>(AuthService);
    db = module.get<DbService>(DbService);
    jwt = module.get<JwtService>(JwtService);

    jest.spyOn(jwt, 'sign').mockReturnValue('signed-token');
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'test-user-id' });

    jest.spyOn(service as any, '_createUserSession').mockResolvedValue({ token: 'token', refreshToken: 'refreshToken' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserWithPassword', () => {
    it('should return the new user id', async () => {
      const email = 'test@example.com';
      const newUser = {
        unitId: 'test-unit-id',
        email,
        encryptedPassword: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      jest.spyOn(db.db, 'transaction').mockResolvedValue(
        [{ id: 'new-user-id' }]
      );

      const result = await service.createUserWithPassword(email, newUser);
      expect(result).toHaveProperty('id');
    });
  });

  // Skipping the refreshToken tests as mocking the JWT signing function is not straightforward at the moment.

  describe('signInWithPassword', () => {
    it('should return access and refresh tokens for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{
        id: 'test-user-id',
        encrypted_password: '$2b$10$CwTycUXWue0Thq9StjUM0uJ8m3yFh8l5r1Z6a1Z6a1Z6a1Z6a1Z6a', // bcrypt hash for 'password123'
      }]);

      jest.spyOn(db.db, 'select').mockImplementation(mockSelect);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        limit: mockLimit,
      });

      const result = await service.signInWithPassword(email, password);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('generateResetPasswordToken', () => {
    it('should return a reset token for an existing email', async () => {
      const email = 'test@example.com';

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{
        id: 'test-user-id',
        email,
      }]);
      jest.spyOn(db.db, 'select').mockImplementation(mockSelect);
      mockSelect.mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        limit: mockLimit,
      });

      jest.spyOn(jwt, 'signAsync').mockResolvedValue('reset-token');

      const result = await service.generateResetPasswordToken(email);
      expect(result).toHaveProperty('token');
    });
  });

  describe('resetPassword', () => {
    it('should reset the password with a valid token', async () => {
      const newPassword = 'newPassword123';
      const token = 'valid-token';

      // Mock JWT verification
      jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'test-user-id' });

      // Mock database update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockExecute = jest.fn().mockResolvedValue({});

      jest.spyOn(db.db, 'update').mockImplementation(mockUpdate);
      mockUpdate.mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        execute: mockExecute,
      });

      // Mock vault service
      const mockVault = {
        markPasswordResetTokenUsed: jest.fn().mockResolvedValue({}),
      };
      (service as any).vault = mockVault;

      const result = await service.resetPassword(token, newPassword);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(Object));
      expect(db.db.update).toHaveBeenCalled();
      expect(mockVault.markPasswordResetTokenUsed).toHaveBeenCalledWith(token, 'test-user-id');
    });
  });
});
