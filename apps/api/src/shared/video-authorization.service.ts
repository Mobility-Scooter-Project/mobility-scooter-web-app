import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Video } from '@infra/db/entity/video/video';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';

@Injectable()
export class VideoAuthorizationService {
  private logger = new Logger(VideoAuthorizationService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly unitAuthorizationService: UnitAuthorizationService,
  ) {}

  public async assertUserCanAccessVideo(
    userId: string,
    videoId: string,
  ): Promise<void> {
    let video: {
      session: { unit: { id: string } };
    } | null;

    try {
      video = await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { session: { unit: true } },
        select: { id: true, session: { id: true, unit: { id: true } } },
      });
    } catch (error) {
      this.logger.error('Failed to load video for access check', error);
      throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );
  }
}
