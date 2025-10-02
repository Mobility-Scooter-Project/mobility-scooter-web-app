import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/routes/app.module';
import request from 'supertest';
import { App } from 'supertest/types';
import dotenv from 'dotenv';
import { USER_ROLES } from '@config/enums';
dotenv.config();

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let unitId: string;
  let userId: string = '';
  let inviteeEmail = `invitee${Math.floor(Math.random() * 10000)}@example.com`;
  let inviteToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Simulate login to get a token
    const response = await request(app.getHttpServer())
      .post('/auth/email')
      .send({ email: 'test@example.com', password: 'testing124' })
      .expect(201);
    token = response.body.token;
    unitId = process.env.TESTING_UNIT_ID || 'missing';
    expect(unitId).not.toBe('missing');

    const profileResponse = await request(app.getHttpServer())
      .get(`/units/${unitId}/users`)
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then((res) => res.body[0].id);
    userId = profileResponse;
    expect(userId).not.toBe('');
  });

  it('POST /units/:unitId/invites', async () => {
    return await request(app.getHttpServer())
      .post(`/units/${unitId}/invite`)
      .set({ authorization: `Bearer ${token}` })
      .send({ email: inviteeEmail, role: USER_ROLES.TRAINEE })
      .expect(201)
      .expect((res) => {
        inviteToken = res.body.token;
        expect(inviteToken).toBeDefined();
        expect(inviteToken.length).toBeGreaterThan(0);
      });
  });

  it('POST /units/invites/accept/:inviteToken', async () => {
    return await request(app.getHttpServer())
      .post(`/units/invites/${inviteToken}`)
      .expect(201);
  });
});
