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
  let userId: string = '';

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
    unitId = await request(app.getHttpServer())
      .get('/me')
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then((res) => res.body.unitId as string | null);
    expect(unitId).toBeTruthy();

    userId = await request(app.getHttpServer())
      .get('/me')
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then((res) => res.body.id as string);
    expect(userId).toBeTruthy();
  });

  it('GET /units/:unitId/users', async () => {
    return await request(app.getHttpServer())
      .get(`/units/${unitId}/users`)
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('email');
        }
      });
  });

  it('PUT /units/:unitId/users/:userId', async () => {
    return await request(app.getHttpServer())
      .put(`/units/${unitId}/users/${userId}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ givenName: 'Updated Name' })
      .expect(200);
  });

  it('DELETE /units/:unitId/users/:userId', async () => {
    const inviteeEmail = `delete-target-${Math.floor(
      Math.random() * 1_000_000,
    )}@example.com`;
    const inviteToken = await request(app.getHttpServer())
      .post(`/units/${unitId}/invite`)
      .set({ authorization: `Bearer ${token}` })
      .send({ email: inviteeEmail, role: USER_ROLES.TRAINEE })
      .expect(201)
      .then((res) => res.body.token as string);

    await request(app.getHttpServer())
      .post(`/units/invites/${inviteToken}`)
      .expect(201);

    const targetUserId = await request(app.getHttpServer())
      .get(`/units/${unitId}/users`)
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then((res) => {
        const invitedUser = (res.body as Array<{ id: string; email: string }>).find(
          (user) => user.email === inviteeEmail,
        );
        return invitedUser?.id ?? '';
      });
    expect(targetUserId).toBeTruthy();

    return await request(app.getHttpServer())
      .delete(`/units/${unitId}/users/${targetUserId}`)
      .set({ authorization: `Bearer ${token}` })
      .expect(200);
  });
});
