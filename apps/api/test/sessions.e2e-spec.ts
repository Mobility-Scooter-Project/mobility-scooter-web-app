import { INestApplication, MiddlewareConsumer, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { App } from 'supertest/types';

import config from '@config/constants';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { SessionsController } from '@src/routes/units/sessions/sessions.controller';
import { SessionsService } from '@src/routes/units/sessions/sessions.service';
import { Patient } from '@infra/db/entity/unit/patient';
import { PatientSession } from '@infra/db/entity/video/session';
import { User } from '@infra/db/entity/user/user';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    JwtModule.register({
      secret: 'test-jwt-secret',
    }),
  ],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    // Provide repository mocks so we don't need a real DB connection for 401 tests.
    { provide: getRepositoryToken(PatientSession), useValue: {} },
    { provide: getRepositoryToken(Patient), useValue: {} },
    { provide: getRepositoryToken(User), useValue: {} },
  ],
})
class TestSessionsE2EModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(SessionsController);
  }
}

describe('SessionsController (e2e)', () => {
  let app: INestApplication<App>;

  const unitId = '11111111-2222-3333-4444-555555555555';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestSessionsE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  /*
   * Omitted for now until unit/patient/org creation flows are implemented
   * enough for these endpoints to succeed end-to-end.
   *
   * Keeping the structure/expectations here so we can quickly re-enable once the data setup exists.
   */

  // describe('POST /units/:unitId/sessions', () => {
  //   it('should return 201 and session metadata for valid input', async () => {
  //     /* const response = await request(app.getHttpServer())
  //       .post(`/units/${unitId}/sessions`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .send({
  //         patientId: '66666666-7777-8888-9999-aaaaaaaaaaaa',
  //         sessionDate: '2025-03-01',
  //         sessionTime: '14:30',
  //       })
  //       .expect(201);
  //
  //     expect(response.body).toHaveProperty('sessionId'); */
  //   });
  // });

  // describe('GET /units/:unitId/sessions', () => {
  //   it('should return 200 with sessions list', async () => {
  //     /* await request(app.getHttpServer())
  //       .get(`/units/${unitId}/sessions`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(200); */
  //   });
  // });

  // describe('GET /units/:unitId/sessions/:sessionId', () => {
  //   it('should return 200 with session details', async () => {
  //     /* const sessionId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
  //     await request(app.getHttpServer())
  //       .get(`/units/${unitId}/sessions/${sessionId}`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(200); */
  //   });
  // });
});

