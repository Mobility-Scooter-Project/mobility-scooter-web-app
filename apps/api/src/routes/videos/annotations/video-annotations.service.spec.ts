import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';

import { VideoAnnotation } from '@infra/db/entity/video/annotation';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoAnnotationsService } from './video-annotations.service';

describe('VideoAnnotationsService', () => {
  let service: VideoAnnotationsService;
  let annotationRepository: jest.Mocked<
    Pick<
      Repository<VideoAnnotation>,
      'create' | 'save' | 'find' | 'findOne' | 'findOneOrFail' | 'delete'
    >
  >;
  let videoAuthorizationService: jest.Mocked<
    Pick<VideoAuthorizationService, 'assertUserCanAccessVideo'>
  >;

  const userId = '11111111-1111-1111-1111-111111111111';
  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const annotationId = '99999999-8888-7777-6666-555555555555';

  beforeEach(async () => {
    annotationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      delete: jest.fn(),
    };

    videoAuthorizationService = {
      assertUserCanAccessVideo: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoAnnotationsService,
        {
          provide: getRepositoryToken(VideoAnnotation),
          useValue: annotationRepository,
        },
        {
          provide: VideoAuthorizationService,
          useValue: videoAuthorizationService,
        },
      ],
    }).compile();

    service = module.get<VideoAnnotationsService>(VideoAnnotationsService);
  });

  it('creates an annotation', async () => {
    annotationRepository.create.mockReturnValue({
      video: { id: videoId } as any,
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    } as VideoAnnotation);
    annotationRepository.save.mockResolvedValue({
      id: annotationId,
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    } as VideoAnnotation);
    annotationRepository.findOne.mockResolvedValue({
      id: annotationId,
      createdByUser: { id: userId } as any,
      updatedByUser: null,
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    } as VideoAnnotation);

    const out = await service.createAnnotation(userId, videoId, {
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    });

    expect(videoAuthorizationService.assertUserCanAccessVideo).toHaveBeenCalledWith(
      userId,
      videoId,
    );
    expect(annotationRepository.create).toHaveBeenCalledWith({
      video: { id: videoId },
      createdByUser: { id: userId },
      updatedByUser: null,
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    });
    expect(out).toEqual({
      annotationId,
      createdByUserId: userId,
      updatedByUserId: null,
      title: 'Important',
      description: 'note',
      startTime: 10,
      endTime: 15,
    });
  });

  it('throws BAD_REQUEST when endTime is before startTime (create)', async () => {
    await expect(
      service.createAnnotation(userId, videoId, {
        title: 'Bad',
        description: 'note',
        startTime: 10,
        endTime: 5,
      }),
    ).rejects.toMatchObject({
      response: 'endTime must be null or greater than or equal to startTime',
      status: HttpStatus.BAD_REQUEST,
    });
    expect(annotationRepository.create).not.toHaveBeenCalled();
  });

  it('lists annotations for a video', async () => {
    const otherUserId = '22222222-2222-2222-2222-222222222222';
    annotationRepository.find.mockResolvedValue([
      {
        id: annotationId,
        createdByUser: { id: otherUserId } as any,
        title: 'A',
        description: 'a',
        startTime: 1,
        endTime: null,
      } as VideoAnnotation,
    ]);

    const out = await service.getAnnotations(userId, videoId);
    expect(annotationRepository.find).toHaveBeenCalledWith({
      where: { video: { id: videoId } },
      relations: { createdByUser: true, updatedByUser: true },
      order: { startTime: 'ASC', cu: { createdAt: 'ASC' } },
    });
    expect(out).toEqual([
      {
        annotationId,
        createdByUserId: otherUserId,
        updatedByUserId: null,
        title: 'A',
        description: 'a',
        startTime: 1,
        endTime: null,
      },
    ]);
  });

  it('updates annotation and sets updatedByUserId', async () => {
    const otherUserId = '22222222-2222-2222-2222-222222222222';
    annotationRepository.findOne.mockResolvedValue({
      id: annotationId,
      createdByUser: { id: otherUserId } as any,
      updatedByUser: null,
      title: 'Old',
      description: 'old',
      startTime: 1,
      endTime: null,
    } as VideoAnnotation);
    annotationRepository.save.mockResolvedValue({} as VideoAnnotation);
    annotationRepository.findOneOrFail.mockResolvedValue({
      id: annotationId,
      createdByUser: { id: otherUserId } as any,
      updatedByUser: { id: userId } as any,
      title: 'New',
      description: 'new',
      startTime: 2,
      endTime: null,
    } as VideoAnnotation);

    const out = await service.updateAnnotation(userId, videoId, annotationId, {
      title: 'New',
      description: 'new',
      startTime: 2,
      endTime: null,
    });

    expect(annotationRepository.save).toHaveBeenCalled();
    expect(annotationRepository.findOneOrFail).toHaveBeenCalled();
    expect(out.updatedByUserId).toBe(userId);
    expect(out.title).toBe('New');
  });

  it('throws NOT_FOUND when single annotation does not exist', async () => {
    annotationRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getAnnotation(userId, videoId, annotationId),
    ).rejects.toMatchObject({
      response: 'Annotation not found',
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('deletes annotation and returns deleted true', async () => {
    annotationRepository.delete.mockResolvedValue({ affected: 1 } as any);

    await expect(
      service.deleteAnnotation(userId, videoId, annotationId),
    ).resolves.toEqual({ deleted: true });
    expect(annotationRepository.delete).toHaveBeenCalledWith({
      id: annotationId,
      video: { id: videoId },
    });
  });

  it('rejects when authorization fails', async () => {
    videoAuthorizationService.assertUserCanAccessVideo.mockRejectedValue(
      new HttpException('Video not found', HttpStatus.NOT_FOUND),
    );

    await expect(service.getAnnotations(userId, videoId)).rejects.toMatchObject({
      response: 'Video not found',
      status: HttpStatus.NOT_FOUND,
    });
  });
});

