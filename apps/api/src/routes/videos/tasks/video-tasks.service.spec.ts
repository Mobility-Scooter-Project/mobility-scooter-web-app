import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VideoTask } from '@infra/db/entity/video/task';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

import { VideoTasksService } from './video-tasks.service';

describe('VideoTasksService', () => {
  let service: VideoTasksService;
  let videoTaskRepository: jest.Mocked<
    Pick<Repository<VideoTask>, 'createQueryBuilder'>
  >;
  let videoAuthorizationService: jest.Mocked<
    Pick<VideoAuthorizationService, 'assertUserCanAccessVideo'>
  >;

  let queryBuilder: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    queryBuilder.innerJoin.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);

    videoTaskRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    videoAuthorizationService = {
      assertUserCanAccessVideo: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoTasksService,
        {
          provide: getRepositoryToken(VideoTask),
          useValue: videoTaskRepository,
        },
        {
          provide: VideoAuthorizationService,
          useValue: videoAuthorizationService,
        },
      ],
    }).compile();

    service = module.get<VideoTasksService>(VideoTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVideoTasks', () => {
    it('asserts user can access the video before querying', async () => {
      await service.getVideoTasks(userId, videoId);

      expect(
        videoAuthorizationService.assertUserCanAccessVideo,
      ).toHaveBeenCalledWith(userId, videoId);
    });

    it('loads tasks via video join query', async () => {
      await service.getVideoTasks(userId, videoId);

      expect(videoTaskRepository.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('t.video', 'v');
      expect(queryBuilder.where).toHaveBeenCalledWith('v.id = :videoId', {
        videoId,
      });
      expect(queryBuilder.getOne).toHaveBeenCalled();
    });

    it('returns tasks from row.tasks when a row exists', async () => {
      const tasks = [
        {
          taskNumber: 1,
          timestamp: 1.5,
          task: 'Ascends low curb',
          note: null,
          score: null,
        },
      ];
      queryBuilder.getOne.mockResolvedValue({ tasks } as VideoTask);

      const result = await service.getVideoTasks(userId, videoId);

      expect(result).toEqual(tasks);
    });

    it('returns empty array when no video_task row exists', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.getVideoTasks(userId, videoId);

      expect(result).toEqual([]);
    });

    it('returns empty array when row exists but tasks is missing', async () => {
      queryBuilder.getOne.mockResolvedValue({
        tasks: undefined,
      } as unknown as VideoTask);

      const result = await service.getVideoTasks(userId, videoId);

      expect(result).toEqual([]);
    });

    it('rejects when authorization fails', async () => {
      videoAuthorizationService.assertUserCanAccessVideo.mockRejectedValue(
        new HttpException('Video not found', HttpStatus.NOT_FOUND),
      );

      await expect(
        service.getVideoTasks(userId, videoId),
      ).rejects.toMatchObject({
        response: 'Video not found',
        status: HttpStatus.NOT_FOUND,
      });
      expect(queryBuilder.getOne).not.toHaveBeenCalled();
    });
  });
});
