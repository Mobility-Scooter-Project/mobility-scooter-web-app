import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/routes/app.module';
import { AuthService } from '@src/routes/auth/auth.service';
import { UsersService } from '@src/routes/units/users/users.service';
import request from 'supertest';
import { App } from 'supertest/types';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  });

  describe('POST /auth/email', () => {
    it('should return 201 and a token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email: 'test@example.com', password: 'testing124' })
        .expect(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email: 'test1@example.com', password: 'testing124' })
        .expect(401);
    });

    it('should return 401 for invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should return 201 and a new token for valid refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email: 'test@example.com', password: 'testing124' })
        .expect(201);
      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ token: refreshToken })
        .expect(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');

      expect(response.body.token).not.toBe(loginResponse.body.token);
      expect(response.body.refreshToken).not.toBe(
        loginResponse.body.refreshToken,
      );
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ token: 'invalidtoken' })
        .expect(401);
    });

    it('should return 401 for a re-used refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email: 'test@example.com', password: 'testing124' })
        .expect(201);
      const refreshToken = loginResponse.body.refreshToken;

      // First use of the refresh token should succeed
      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ token: refreshToken })
        .expect(201);

      // Second use of the same refresh token should fail
      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ token: refreshToken })
        .expect(401);
    });
  });

  describe('POST /auth/email/reset-password/token', () => {
    it('should return 201 for existing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email: 'test@example.com' })
        .expect(201);
    });

    it('should return 201 for non-existing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email: '/auth/email/reset-password/token' })
        .expect(201);
    });
  });

  describe('PATCH /auth/email/reset-password', () => {
    it('should return 200 for valid token and change the password', async () => {
      const email = 'test@example.com';
      const newPassword = 'newpassword123';

      // Step 1: Request a password reset token
      const tokenResponse = await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email })
        .expect(201);
      const { token } = tokenResponse.body;
      expect(token).toBeDefined();

      // Step 2: Use the token to reset the password
      await request(app.getHttpServer())
        .patch('/auth/email/reset-password')
        .send({ token, newPassword })
        .expect(200);

      // Step 3: Verify that the new password works
      await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email, password: newPassword })
        .expect(201);

      // Step 4: Verify that the old password no longer works
      await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email, password: 'testing124' })
        .expect(401);

      // Reset password back to original for other tests
      const resetResponse = await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email })
        .expect(201);
      const resetToken = resetResponse.body.token;
      expect(resetToken).toBeDefined();

      await request(app.getHttpServer())
        .patch('/auth/email/reset-password')
        .send({ token: resetToken, newPassword: 'testing124' })
        .expect(200);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .patch('/auth/email/reset-password')
        .send({ token: 'invalidtoken', newPassword: 'newpassword123' })
        .expect(401);
    });
  });

  afterAll(async () => {
    //reset the test user's password
    await request(app.getHttpServer())
      .patch('/auth/email/reset-password')
      .send({
        token: await authService.generateResetPasswordToken('test@example.com'),
        newPassword: 'testing124',
      });
  });
});
