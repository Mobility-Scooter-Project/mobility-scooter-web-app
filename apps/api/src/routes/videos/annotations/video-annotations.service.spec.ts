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
    Pick<Repository<VideoAnnotation>, 'create' | 'save' | 'find' | 'findOne' | 'delete'>
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
      description: 'note',
      startTime: 10,
      endTime: 15,
    } as VideoAnnotation);
    annotationRepository.save.mockResolvedValue({
      id: annotationId,
      description: 'note',
      startTime: 10,
      endTime: 15,
    } as VideoAnnotation);

    const out = await service.createAnnotation(userId, videoId, {
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
      user: { id: userId },
      description: 'note',
      startTime: 10,
      endTime: 15,
    });
    expect(out).toEqual({
      annotationId,
      description: 'note',
      startTime: 10,
      endTime: 15,
    });
  });

  it('lists annotations for a video', async () => {
    annotationRepository.find.mockResolvedValue([
      {
        id: annotationId,
        description: 'a',
        startTime: 1,
        endTime: null,
      } as VideoAnnotation,
    ]);

    const out = await service.getAnnotations(userId, videoId);
    expect(annotationRepository.find).toHaveBeenCalledWith({
      where: { video: { id: videoId }, user: { id: userId } },
      order: { startTime: 'ASC', cu: { createdAt: 'ASC' } },
    });
    expect(out).toEqual([
      {
        annotationId,
        description: 'a',
        startTime: 1,
        endTime: null,
      },
    ]);
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
      user: { id: userId },
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

