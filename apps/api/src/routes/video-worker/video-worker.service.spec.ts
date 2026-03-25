import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VideoWorkerService } from './video-worker.service';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';

describe('VideoWorkerService', () => {
  let service: VideoWorkerService;

  let videoRepository: Repository<Video>;
  let statusRepository: Repository<VideoWorkerStatus>;
  let stepStatusRepository: Repository<VideoWorkerStepStatus>;

  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const step = 'transcription';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([Video, VideoWorkerStatus, VideoWorkerStepStatus])],
      providers: [VideoWorkerService],
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
        service.markVideoCompleted({ videoId, durationSec: 12 }),
      ).rejects.toMatchObject({
        response: 'Video not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when video lookup fails', async () => {
      jest.spyOn(videoRepository, 'findOne').mockRejectedValue(new Error('db error'));

      await expect(
        service.markVideoCompleted({ videoId, durationSec: 12 }),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('returns canonical state and acknowledged=true', async () => {
      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
      } as Video);

      const workerStatus = {
        videoId,
        overallStatus: 'processed',
        durationSec: 99,
        steps: [
          {
            step: 'transcription',
            status: 'processed',
            attempts: 2,
            lastError: null,
            durationSec: 12,
          },
        ],
      };

      jest
        .spyOn(service, 'getWorkerStatus')
        .mockResolvedValue(workerStatus as any);

      const result = await service.markVideoCompleted({ videoId, durationSec: 99 });
      expect(service.getWorkerStatus).toHaveBeenCalledWith(videoId);
      expect(result).toEqual({ ...workerStatus, acknowledged: true });
    });
  });

  describe('getWorkerStatus', () => {
    it('returns mapped overall status + steps', async () => {
      jest.spyOn(statusRepository, 'findOne').mockResolvedValue({
        videoId,
        durationSec: 123,
        statusEvent: { status: 'processed' },
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
        overallStatus: 'processed',
        durationSec: 123,
        steps: [
          {
            step: 'step1',
            status: 'done',
            attempts: 2,
            lastError: 'boom',
            durationSec: 9,
          },
          {
            step: 'step2',
            status: 'pending',
            attempts: 0,
            lastError: null,
            durationSec: null,
          },
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
        lastError: 'err',
        durationSec: 7,
      });
    });

    it('returns null fields (not 404) when step row is missing', async () => {
      jest.spyOn(stepStatusRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getWorkerStepStatus(videoId, step);

      expect(result).toEqual({
        videoId,
        step,
        status: null,
        attempts: null,
        lastError: null,
        durationSec: null,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when lookup fails', async () => {
      jest.spyOn(stepStatusRepository, 'findOne').mockRejectedValue(new Error('db error'));

      await expect(
        service.getWorkerStepStatus(videoId, step),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });
});

