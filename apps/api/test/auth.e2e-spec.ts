import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/routes/app.module';
import { AuthService } from '@src/routes/auth/auth.service';
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

  describe('POST /auth/email/sign-up/join-org', () => {
    async function testOrgAndUnitIds(): Promise<{ orgId: string; unitId: string }> {
      const res = await request(app.getHttpServer())
        .get('/organizations/join-signup-options')
        .expect(200);
      const org = res.body.orgs.find(
        (o: { name: string }) => o.name === 'Test Org',
      );
      expect(org).toBeDefined();
      const unit = org.units.find(
        (u: { name: string }) => u.name === 'Test Unit',
      );
      expect(unit).toBeDefined();
      return { orgId: org.id, unitId: unit.id };
    }

    it('should submit application, set password via email link token, then sign in', async () => {
      const { orgId, unitId } = await testOrgAndUnitIds();
      const email = `join-e2e-${Date.now()}@example.com`;
      const signup = await request(app.getHttpServer())
        .post('/auth/email/sign-up/join-org')
        .send({
          email,
          orgId,
          unitId,
          givenName: 'E2E',
          surname: 'Join',
        })
        .expect(201);

      expect(signup.body.completeToken).toBeDefined();

      await request(app.getHttpServer())
        .post('/auth/email/sign-up/create-account/complete')
        .send({
          token: signup.body.completeToken,
          password: 'testing124',
        })
        .expect(201);

      const login = await request(app.getHttpServer())
        .post('/auth/email')
        .send({ email, password: 'testing124' })
        .expect(201);
      expect(login.body.token).toBeDefined();
    });

    it('should return 400 when organization or unit ids do not match', async () => {
      await request(app.getHttpServer())
        .post('/auth/email/sign-up/join-org')
        .send({
          email: `noorg-${Date.now()}@example.com`,
          orgId: '00000000-0000-4000-8000-000000000001',
          unitId: '00000000-0000-4000-8000-000000000002',
        })
        .expect(400);
    });

    it('should allow resubmit while application is still pending', async () => {
      const { orgId, unitId } = await testOrgAndUnitIds();
      const email = `pending-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/email/sign-up/join-org')
        .send({
          email,
          orgId,
          unitId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/email/sign-up/join-org')
        .send({
          email,
          orgId,
          unitId,
        })
        .expect(201);
    });

    it('should return 400 when email already belongs to a completed account', async () => {
      const { orgId, unitId } = await testOrgAndUnitIds();
      await request(app.getHttpServer())
        .post('/auth/email/sign-up/join-org')
        .send({
          email: 'test@example.com',
          orgId,
          unitId,
        })
        .expect(400);
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
    it('should return 201 with message for existing email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email: 'test@example.com' })
        .expect(201);
      expect(res.body.message).toBeDefined();
    });

    it('should return 201 with the same shape for non-existing email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/email/reset-password/token')
        .send({ email: '/auth/email/reset-password/token' })
        .expect(201);
      expect(res.body.message).toBeDefined();
      expect(res.body.token).toBeUndefined();
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
      expect(token).toBeDefined(); // dev: token returned when SMTP is not configured

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
    const reset = await authService.generateResetPasswordToken('test@example.com');
    if (reset.token) {
      await request(app.getHttpServer())
        .patch('/auth/email/reset-password')
        .send({ token: reset.token, newPassword: 'testing124' });
    }
  });
});
