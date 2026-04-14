import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stability } from '@infra/db/entity/video/stability';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoStabilityService } from './video-stability.service';

describe('VideoStabilityService', () => {
  let service: VideoStabilityService;
  let stabilityRepository: jest.Mocked<Pick<Repository<Stability>, 'find'>>;
  let stepStatusRepository: jest.Mocked<
    Pick<Repository<VideoWorkerStepStatus>, 'findOne'>
  >;
  let videoAuthorizationService: jest.Mocked<
    Pick<VideoAuthorizationService, 'assertUserCanAccessVideo'>
  >;

  const userId = '11111111-1111-1111-1111-111111111111';
  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  beforeEach(async () => {
    stabilityRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    stepStatusRepository = {
      findOne: jest.fn().mockResolvedValue({
        videoId,
        step: 'stability_classification',
        status: 'completed',
      } as any),
    };
    videoAuthorizationService = {
      assertUserCanAccessVideo: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoStabilityService,
        { provide: getRepositoryToken(Stability), useValue: stabilityRepository },
        {
          provide: getRepositoryToken(VideoWorkerStepStatus),
          useValue: stepStatusRepository,
        },
        {
          provide: VideoAuthorizationService,
          useValue: videoAuthorizationService,
        },
      ],
    }).compile();

    service = module.get<VideoStabilityService>(VideoStabilityService);
  });

  it('returns stability rows when step is completed', async () => {
    stabilityRepository.find.mockResolvedValue([
      {
        startFrame: 0,
        endFrame: 29,
        startTime: 0,
        endTime: 1,
        predictedClass: 1,
        confidence: 0.92,
      } as any,
    ]);

    const out = await service.getVideoStability(userId, videoId);

    expect(videoAuthorizationService.assertUserCanAccessVideo).toHaveBeenCalledWith(
      userId,
      videoId,
    );
    expect(stepStatusRepository.findOne).toHaveBeenCalledWith({
      where: { videoId, step: 'stability_classification' },
    });
    expect(out).toEqual([
      {
        startFrame: 0,
        endFrame: 29,
        startTime: 0,
        endTime: 1,
        predictedClass: 1,
        confidence: 0.92,
      },
    ]);
  });

  it('throws CONFLICT when stability step is not ready', async () => {
    stepStatusRepository.findOne.mockResolvedValue({
      videoId,
      step: 'stability_classification',
      status: 'processing',
    } as any);

    await expect(service.getVideoStability(userId, videoId)).rejects.toMatchObject(
      {
        status: HttpStatus.CONFLICT,
        response: 'Stability classification not ready',
      },
    );
  });

  it('throws CONFLICT when stability step failed', async () => {
    stepStatusRepository.findOne.mockResolvedValue({
      videoId,
      step: 'stability_classification',
      status: 'failed',
    } as any);

    await expect(service.getVideoStability(userId, videoId)).rejects.toMatchObject(
      {
        status: HttpStatus.CONFLICT,
        response: 'Stability classification failed',
      },
    );
  });
});
