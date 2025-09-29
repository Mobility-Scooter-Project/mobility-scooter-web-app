import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/routes/app.module';

describe('MeController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

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
  });

  it('GET /me', async () => {
    return await request(app.getHttpServer())
      .get('/me')
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .expect({
        id: 'c5ed92bf-ef53-4110-b42d-055db2095d7c',
        email: 'test@example.com',
        givenName: 'Test',
        surname: 'User',
        role: 'admin',
        title: null,
        phoneNumber: null,
        city: null,
      });
  });
});
