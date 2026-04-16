import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Stability } from '@infra/db/entity/video/stability';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { Repository } from 'typeorm';

type StabilityRow = {
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  predictedClass: number;
  confidence: number;
};

@Injectable()
export class VideoStabilityService {
  private logger = new Logger(VideoStabilityService.name);

  constructor(
    @InjectRepository(Stability)
    private readonly stabilityRepository: Repository<Stability>,
    @InjectRepository(VideoWorkerStepStatus)
    private readonly stepStatusRepository: Repository<VideoWorkerStepStatus>,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  public async getVideoStability(
    userId: string,
    videoId: string,
  ): Promise<StabilityRow[]> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    const stabilityStep = await this.stepStatusRepository.findOne({
      where: { videoId, step: 'stability_classification' },
    });

    if (!stabilityStep || stabilityStep.status !== 'completed') {
      const message =
        stabilityStep?.status === 'failed'
          ? 'Stability classification failed'
          : 'Stability classification not ready';
      this.logger.warn(
        `Blocked stability fetch for ${videoId}: step status is ${stabilityStep?.status ?? 'missing'}`,
      );
      throw new HttpException(message, HttpStatus.CONFLICT);
    }

    const rows = await this.stabilityRepository.find({
      where: { video: { id: videoId } },
      order: { startFrame: 'ASC', id: 'ASC' },
    });

    return rows.map((r) => ({
      startFrame: r.startFrame,
      endFrame: r.endFrame,
      startTime: r.startTime,
      endTime: r.endTime,
      predictedClass: r.predictedClass,
      confidence: r.confidence,
    }));
  }
}
