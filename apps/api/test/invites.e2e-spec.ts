import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/routes/app.module';
import request from 'supertest';
import { App } from 'supertest/types';
import { USER_ROLES } from '@config/enums';

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let unitId: string;

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
    const resolvedUnitId = await request(app.getHttpServer())
      .get('/me')
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then((res) => res.body.unitId as string | null);
    expect(resolvedUnitId).toBeTruthy();
    if (!resolvedUnitId) {
      throw new Error('Expected /me to return unitId');
    }
    unitId = resolvedUnitId;

  });

  it('POST /units/:unitId/invites', async () => {
    const inviteeEmail = `invitee${Math.floor(Math.random() * 10000)}@example.com`;
    return await request(app.getHttpServer())
      .post(`/units/${unitId}/invite`)
      .set({ authorization: `Bearer ${token}` })
      .send({ email: inviteeEmail, role: USER_ROLES.TRAINEE })
      .expect(201)
      .expect((res) => {
        const inviteToken = res.body.token as string;
        expect(inviteToken).toBeDefined();
        expect(inviteToken.length).toBeGreaterThan(0);
      });
  });

  it('POST /units/invites/accept/:inviteToken', async () => {
    const inviteeEmail = `invitee${Math.floor(Math.random() * 10000)}@example.com`;
    const inviteToken = await request(app.getHttpServer())
      .post(`/units/${unitId}/invite`)
      .set({ authorization: `Bearer ${token}` })
      .send({ email: inviteeEmail, role: USER_ROLES.TRAINEE })
      .expect(201)
      .then((res) => res.body.token as string);

    return await request(app.getHttpServer())
      .post(`/units/invites/${inviteToken}`)
      .expect(201);
  });
});
