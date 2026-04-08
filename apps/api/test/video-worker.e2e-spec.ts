import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { VideoWorkerController } from '@src/routes/video-worker/video-worker.controller';
import { VideoWorkerService } from '@src/routes/video-worker/video-worker.service';

import { VIDEO_WORKER_COMPLETED_STEPS } from '@config/enums';

describe('VideoWorkerController (e2e)', () => {
  let app: INestApplication<App>;

  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const durationSec = 12;

  const mockVideoWorkerService = {
    getWorkerStatus: jest.fn().mockResolvedValue({
      videoId,
      overallStatus: 'processed',
      durationSec,
      steps: [],
    }),
    getWorkerStepStatus: jest.fn().mockResolvedValue({
      videoId,
      step: VIDEO_WORKER_COMPLETED_STEPS.POSE_ESTIMATION,
      status: 'processed',
      attempts: 1,
      lastError: null,
      durationSec: 5,
    }),
    markVideoCompleted: jest.fn().mockResolvedValue({
      videoId,
      overallStatus: 'processed',
      durationSec,
      steps: [],
      acknowledged: true,
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'videoWorkerSecret') return 'test-secret';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VideoWorkerController],
      providers: [
        { provide: VideoWorkerService, useValue: mockVideoWorkerService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /video-worker/:videoId/status returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/video-worker/${videoId}/status`)
      .expect(200);

    expect(res.body).toHaveProperty('videoId', videoId);
    expect(mockVideoWorkerService.getWorkerStatus).toHaveBeenCalledWith(
      videoId,
    );
  });

  it('GET /video-worker/:videoId/:step/status returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/video-worker/${videoId}/${VIDEO_WORKER_COMPLETED_STEPS.POSE_ESTIMATION}/status`,
      )
      .expect(200);

    expect(res.body).toHaveProperty('step', VIDEO_WORKER_COMPLETED_STEPS.POSE_ESTIMATION);
    expect(mockVideoWorkerService.getWorkerStepStatus).toHaveBeenCalledWith(
      videoId,
      VIDEO_WORKER_COMPLETED_STEPS.POSE_ESTIMATION,
    );
  });

  it('POST /video-worker/completed returns 401 when secret mismatches', async () => {
    await request(app.getHttpServer())
      .post('/video-worker/completed')
      .set('X-Video-Worker-Secret', 'wrong-secret')
      .send({ videoId, durationSec })
      .expect(401)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', 'Invalid webhook secret');
      });
  });

  it('POST /video-worker/completed returns 200 when secret matches', async () => {
    await request(app.getHttpServer())
      .post('/video-worker/completed')
      .set('X-Video-Worker-Secret', 'test-secret')
      .send({ videoId, durationSec })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('acknowledged', true);
      });

    expect(mockVideoWorkerService.markVideoCompleted).toHaveBeenCalled();
  });

  it('GET /video-worker/:videoId/:step/status returns 400 for invalid step', async () => {
    await request(app.getHttpServer())
      .get(`/video-worker/${videoId}/not-a-real-step/status`)
      .expect(400);
  });
});
