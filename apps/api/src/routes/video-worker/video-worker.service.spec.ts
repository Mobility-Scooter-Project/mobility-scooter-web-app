import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VideoWorkerService } from './video-worker.service';
import { VideoWorkerSseService } from './sse/video-worker-sse.service';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import {
  VIDEO_WORKER_OVERALL_STATUS,
  VIDEO_WORKER_STEP_STATUS,
  VIDEO_WORKER_STEPS,
} from '@config/enums';

describe('VideoWorkerService', () => {
  let service: VideoWorkerService;

  let videoRepository: Repository<Video>;
  let statusRepository: Repository<VideoWorkerStatus>;
  let stepStatusRepository: Repository<VideoWorkerStepStatus>;

  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const step = 'transcription';

  const videoWorkerSseService = { emit: jest.fn() };

  beforeEach(async () => {
    videoWorkerSseService.emit.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([
          Video,
          VideoWorkerStatus,
          VideoWorkerStepStatus,
        ]),
      ],
      providers: [
        VideoWorkerService,
        { provide: VideoWorkerSseService, useValue: videoWorkerSseService },
      ],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<VideoWorkerService>(VideoWorkerService);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
    statusRepository = module.get<Repository<VideoWorkerStatus>>(
      getRepositoryToken(VideoWorkerStatus),
    );
    stepStatusRepository = module.get<Repository<VideoWorkerStepStatus>>(
      getRepositoryToken(VideoWorkerStepStatus),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markVideoCompleted', () => {
    it('throws NOT_FOUND when video is missing', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.markVideoCompleted({
          videoId,
          durationSec: 12,
          overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
        }),
      ).rejects.toMatchObject({
        response: 'Video not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when video lookup fails', async () => {
      jest
        .spyOn(videoRepository, 'findOne')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.markVideoCompleted({
          videoId,
          durationSec: 12,
          overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
        }),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('emits SSE from webhook DTO and returns ack echo (no getWorkerStatus)', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
      } as Video);

      const getStatusSpy = jest.spyOn(service, 'getWorkerStatus');

      const result = await service.markVideoCompleted({
        videoId,
        durationSec: 99,
        overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
      });

      expect(getStatusSpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        videoId,
        overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
        durationSec: 99,
        acknowledged: true,
      });
      expect(videoWorkerSseService.emit).toHaveBeenCalledWith({
        type: 'overall',
        videoId,
        overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
        durationSec: 99,
      });
    });
  });

  describe('markStepCompleted', () => {
    it('throws NOT_FOUND when video is missing', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.markStepCompleted({
          videoId,
          step: VIDEO_WORKER_STEPS.TASK_DETECTION,
          status: VIDEO_WORKER_STEP_STATUS.COMPLETED,
          durationSec: 10,
          attempts: 1,
        }),
      ).rejects.toMatchObject({
        response: 'Video not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('emits SSE from webhook DTO (completed)', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
      } as Video);

      const getStepSpy = jest.spyOn(service, 'getWorkerStepStatus');

      const expected = {
        videoId,
        step: VIDEO_WORKER_STEPS.POSE_ESTIMATION,
        status: 'completed',
        attempts: 1,
        durationSec: 12,
        lastError: null,
      };

      const result = await service.markStepCompleted({
        videoId,
        step: VIDEO_WORKER_STEPS.POSE_ESTIMATION,
        status: VIDEO_WORKER_STEP_STATUS.COMPLETED,
        durationSec: 12,
        attempts: 1,
      });

      expect(getStepSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ ...expected, acknowledged: true });
      expect(videoWorkerSseService.emit).toHaveBeenCalledWith({
        type: 'step',
        ...expected,
      });
    });

    it('emits SSE from webhook DTO when durationSec omitted (null in snapshot)', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
      } as Video);

      const result = await service.markStepCompleted({
        videoId,
        step: VIDEO_WORKER_STEPS.POSE_ESTIMATION,
        status: VIDEO_WORKER_STEP_STATUS.COMPLETED,
        attempts: 2,
      });

      expect(result).toMatchObject({
        durationSec: null,
        attempts: 2,
        lastError: null,
        acknowledged: true,
      });
      expect(videoWorkerSseService.emit).toHaveBeenCalledWith({
        type: 'step',
        videoId,
        step: VIDEO_WORKER_STEPS.POSE_ESTIMATION,
        status: 'completed',
        durationSec: null,
        attempts: 2,
        lastError: null,
      });
    });

    it('emits SSE from webhook DTO (failed, null durationSec)', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
      } as Video);

      await service.markStepCompleted({
        videoId,
        step: VIDEO_WORKER_STEPS.TASK_DETECTION,
        status: VIDEO_WORKER_STEP_STATUS.FAILED,
        attempts: 1,
        lastError: 'Downloaded transcript is empty',
      });

      expect(videoWorkerSseService.emit).toHaveBeenCalledWith({
        type: 'step',
        videoId,
        step: VIDEO_WORKER_STEPS.TASK_DETECTION,
        status: 'failed',
        durationSec: null,
        attempts: 1,
        lastError: 'Downloaded transcript is empty',
      });
    });
  });

  describe('getWorkerStatus', () => {
    it('returns mapped overall status + steps', async () => {
      jest.spyOn(statusRepository, 'findOne').mockResolvedValue({
        videoId,
        durationSec: 123,
        statusEvent: { status: VIDEO_WORKER_OVERALL_STATUS.PROCESSED },
      } as any);

      jest.spyOn(stepStatusRepository, 'find').mockResolvedValue([
        {
          videoId,
          step: 'step1',
          status: 'done',
          attempts: 2,
          lastError: 'boom',
          durationSec: 9,
        },
        {
          videoId,
          step: 'step2',
          status: 'pending',
          attempts: 0,
          lastError: null,
          durationSec: null,
        },
      ] as any);

      const result = await service.getWorkerStatus(videoId);

      expect(statusRepository.findOne).toHaveBeenCalledWith({
        where: { videoId },
        relations: { statusEvent: true },
      });
      expect(stepStatusRepository.find).toHaveBeenCalledWith({
        where: { videoId },
      });

      expect(result).toEqual({
        videoId,
        overallStatus: VIDEO_WORKER_OVERALL_STATUS.PROCESSED,
        durationSec: 123,
        steps: [
          { step: 'step1', status: 'done' },
          { step: 'step2', status: 'pending' },
        ],
      });
    });

    it('returns null overallStatus/durationSec when status row is missing', async () => {
      jest.spyOn(statusRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(stepStatusRepository, 'find').mockResolvedValue([]);

      const result = await service.getWorkerStatus(videoId);

      expect(result).toEqual({
        videoId,
        overallStatus: null,
        durationSec: null,
        steps: [],
      });
    });
  });

  describe('getWorkerStepStatus', () => {
    it('returns mapped step status when the row exists', async () => {
      jest.spyOn(stepStatusRepository, 'findOne').mockResolvedValue({
        videoId,
        step,
        status: 'done',
        attempts: 3,
        lastError: 'err',
        durationSec: 7,
      } as any);

      const result = await service.getWorkerStepStatus(videoId, step);

      expect(stepStatusRepository.findOne).toHaveBeenCalledWith({
        where: { videoId, step },
      });
      expect(result).toEqual({
        videoId,
        step,
        status: 'done',
        attempts: 3,
        durationSec: 7,
        lastError: 'err',
      });
    });

    it('returns null fields (not 404) when step row is missing', async () => {
      jest.spyOn(stepStatusRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getWorkerStepStatus(videoId, step);

      expect(result).toEqual({
        videoId,
        step,
        status: null,
        attempts: 0,
        durationSec: null,
        lastError: null,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when lookup fails', async () => {
      jest
        .spyOn(stepStatusRepository, 'findOne')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.getWorkerStepStatus(videoId, step),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
