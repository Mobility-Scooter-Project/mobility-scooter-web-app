import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keypoint } from '@infra/db/entity/video/keypoint';
import { KeypointsService } from './keypoints.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { HttpStatus } from '@nestjs/common';

describe('KeypointsService', () => {
  let service: KeypointsService;
  let keypointRepository: jest.Mocked<
    Pick<Repository<Keypoint>, 'findOne' | 'createQueryBuilder'>
  >;
  let videoAuthorizationService: jest.Mocked<
    Pick<VideoAuthorizationService, 'assertUserCanAccessVideo'>
  >;

  const userId = '11111111-1111-1111-1111-111111111111';
  const videoId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  beforeEach(async () => {
    const mockQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    };

    keypointRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };
    videoAuthorizationService = {
      assertUserCanAccessVideo: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeypointsService,
        { provide: getRepositoryToken(Keypoint), useValue: keypointRepository },
        {
          provide: VideoAuthorizationService,
          useValue: videoAuthorizationService,
        },
      ],
    }).compile();

    service = module.get<KeypointsService>(KeypointsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNearest', () => {
    it('throws BAD_REQUEST when maxDeltaSeconds < 0', async () => {
      await expect(
        service.getNearest(userId, videoId, 10, -0.5),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
    });
  });
});
