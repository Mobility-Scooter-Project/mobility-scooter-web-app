import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '@src/routes/app.module';
import request from 'supertest';
import { App } from 'supertest/types';
import dotenv from 'dotenv';
dotenv.config();

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
    return await request(app.getHttpServer())
      .delete(`/units/${unitId}/users/${userId}`)
      .set({ authorization: `Bearer ${token}` })
      .expect(200);
  });
});
