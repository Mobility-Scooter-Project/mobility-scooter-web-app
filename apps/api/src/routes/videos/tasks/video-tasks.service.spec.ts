import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { VideoTask } from '@infra/db/entity/video/task';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

import { VideoTasksService } from './video-tasks.service';

describe('VideoTasksService', () => {
  let service: VideoTasksService;
  let videoTaskRepository: jest.Mocked<
    Pick<
      Repository<VideoTask>,
      | 'find'
      | 'findOne'
      | 'findOneOrFail'
      | 'create'
      | 'save'
      | 'delete'
    >
  >;
  let videoAuthorizationService: jest.Mocked<
    Pick<VideoAuthorizationService, 'assertUserCanAccessVideo'>
  >;

  const userId = '11111111-1111-1111-1111-111111111111';
  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const taskId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const row = (over: Partial<VideoTask> = {}): VideoTask =>
    ({
      id: taskId,
      timestamp: 1.5,
      task: 'Ascends low curb',
      note: null,
      score: null,
      createdByUser: null,
      updatedByUser: null,
      ...over,
    }) as VideoTask;

  beforeEach(async () => {
    videoTaskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((e: DeepPartial<VideoTask>) => e as VideoTask) as unknown as jest.Mocked<
        Pick<Repository<VideoTask>, 'create'>
      >['create'],
      save: jest.fn(),
      delete: jest.fn(),
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
    it('lists tasks ordered by timestamp then id', async () => {
      videoTaskRepository.find.mockResolvedValue([
        row({ id: 'a', timestamp: 1 }),
        row({
          id: 'b',
          timestamp: 2,
          task: 'Other',
          createdByUser: { id: userId } as any,
        }),
      ]);

      const out = await service.getVideoTasks(userId, videoId);

      expect(videoTaskRepository.find).toHaveBeenCalledWith({
        where: { video: { id: videoId } },
        order: { timestamp: 'ASC', id: 'ASC' },
        relations: { createdByUser: true, updatedByUser: true },
      });
      expect(out).toEqual([
        {
          taskId: 'a',
          timestamp: 1,
          task: 'Ascends low curb',
          note: null,
          score: null,
          createdByUserId: null,
          updatedByUserId: null,
        },
        {
          taskId: 'b',
          timestamp: 2,
          task: 'Other',
          note: null,
          score: null,
          createdByUserId: userId,
          updatedByUserId: null,
        },
      ]);
    });

    it('returns empty array when none', async () => {
      videoTaskRepository.find.mockResolvedValue([]);
      const out = await service.getVideoTasks(userId, videoId);
      expect(out).toEqual([]);
    });
  });

  describe('createVideoTask', () => {
    it('creates row with createdByUserId set', async () => {
      const saved = row({
        timestamp: 9,
        task: 'Manual',
        createdByUser: { id: userId } as any,
      });
      videoTaskRepository.save.mockResolvedValue(saved);
      videoTaskRepository.findOneOrFail.mockResolvedValue(saved);

      const out = await service.createVideoTask(userId, videoId, {
        timestamp: 9,
        task: 'Manual',
      });

      expect(videoTaskRepository.create).toHaveBeenCalledWith({
        video: { id: videoId },
        timestamp: 9,
        task: 'Manual',
        note: null,
        score: null,
        createdByUser: { id: userId },
        updatedByUser: null,
      });
      expect(videoTaskRepository.findOneOrFail).toHaveBeenCalled();
      expect(out.taskId).toBe(taskId);
      expect(out.createdByUserId).toBe(userId);
    });
  });

  describe('updateVideoTask', () => {
    it('updates fields and sets updatedByUser', async () => {
      const existing = row({ createdByUser: null });
      videoTaskRepository.findOne.mockResolvedValue(existing);
      videoTaskRepository.save.mockImplementation(async (r) => r as VideoTask);
      videoTaskRepository.findOneOrFail.mockResolvedValue({
        ...existing,
        note: 'edited',
        updatedByUser: { id: userId } as any,
      } as VideoTask);

      const out = await service.updateVideoTask(userId, videoId, taskId, {
        note: 'edited',
      });

      expect(existing.note).toBe('edited');
      expect(out.note).toBe('edited');
      expect(out.updatedByUserId).toBe(userId);
    });

    it('throws NOT_FOUND when missing', async () => {
      videoTaskRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateVideoTask(userId, videoId, taskId, { note: 'x' }),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });

  describe('deleteVideoTask', () => {
    it('deletes one row', async () => {
      videoTaskRepository.delete.mockResolvedValue({ affected: 1 } as any);
      await expect(
        service.deleteVideoTask(userId, videoId, taskId),
      ).resolves.toEqual({ deleted: true });
    });

    it('throws NOT_FOUND when missing', async () => {
      videoTaskRepository.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(
        service.deleteVideoTask(userId, videoId, taskId),
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });
  });
});
