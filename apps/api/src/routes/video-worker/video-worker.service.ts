import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import {
  VideoWorkerStatusDto,
  VideoWorkerStepStatusDto,
} from './video-worker-status.dto';
import { VideoWorkerSseService } from './sse/video-worker-sse.service';
import { VIDEO_WORKER_STEP_STATUS } from '@config/enums';

type StepStatusInfo = {
  videoId: string;
  step: string;
  status: string | null;
  durationSec: number | null;
  attempts: number;
  lastError: string | null;
};

type StatusInfo = {
  videoId: string;
  overallStatus: string | null;
  durationSec: number | null;
  steps: { step: string; status: string }[];
};

type StepCompletionResponse = StepStatusInfo & {
  acknowledged: boolean;
};

/** Webhook ack + echo of body; step breakdown is only on GET .../status. */
type OverallCompletionResponse = {
  videoId: string;
  overallStatus: string;
  durationSec: number;
  acknowledged: boolean;
};

@Injectable()
export class VideoWorkerService {
  private logger = new Logger(VideoWorkerService.name);

  constructor(
    @InjectRepository(VideoWorkerStatus)
    private readonly statusRepository: Repository<VideoWorkerStatus>,
    @InjectRepository(VideoWorkerStepStatus)
    private readonly stepStatusRepository: Repository<VideoWorkerStepStatus>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoWorkerSseService: VideoWorkerSseService,
  ) {}

  /**
   * Completion webhook: worker has already persisted status via `db.py`.
   * Validates video exists, logs, emits a minimal SSE notification from the DTO,
   * and returns an ack echo (no DB read of `video_worker`; use GET .../status for detail).
   */
  public async markVideoCompleted(
    dto: VideoWorkerStatusDto,
  ): Promise<OverallCompletionResponse> {
    let video: Video | null;
    try {
      video = await this.videoRepository.findOne({
        where: { id: dto.videoId },
      });
    } catch (error) {
      this.logger.error('Failed to load video for completion webhook', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!video) {
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    this.logger.log(
      `Completion webhook: videoId=${dto.videoId} status=${dto.overallStatus} durationSec=${dto.durationSec}`,
    );

    this.videoWorkerSseService.emit({
      type: 'overall',
      videoId: dto.videoId,
      overallStatus: dto.overallStatus,
      durationSec: dto.durationSec,
    });

    return {
      videoId: dto.videoId,
      overallStatus: dto.overallStatus,
      durationSec: dto.durationSec,
      acknowledged: true,
    };
  }

  /**
   * Step terminal webhook: validated body matches what the worker committed to `step_status`.
   * SSE and the HTTP response use the DTO (no extra read of `step_status`).
   */
  public async markStepCompleted(
    dto: VideoWorkerStepStatusDto,
  ): Promise<StepCompletionResponse> {
    let video: Video | null;
    try {
      video = await this.videoRepository.findOne({
        where: { id: dto.videoId },
      });
    } catch (error) {
      this.logger.error('Failed to load video for step webhook', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!video) {
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    this.logger.log(
      `Step webhook: videoId=${dto.videoId} step=${dto.step} status=${dto.status} durationSec=${dto.durationSec ?? 'n/a'}`,
    );

    const snapshot: StepStatusInfo = {
      videoId: dto.videoId,
      step: dto.step,
      status: dto.status,
      durationSec: dto.durationSec ?? null,
      attempts: dto.attempts,
      lastError:
        dto.status === VIDEO_WORKER_STEP_STATUS.COMPLETED
          ? null
          : (dto.lastError ?? null),
    };

    this.videoWorkerSseService.emit({
      type: 'step',
      videoId: snapshot.videoId,
      step: snapshot.step,
      status: snapshot.status,
      durationSec: snapshot.durationSec,
      attempts: snapshot.attempts,
      lastError: snapshot.lastError,
    });

    return {
      ...snapshot,
      acknowledged: true,
    };
  }

  /**
   * Gets the worker status for a given video.
   * @param videoId - ID of the video
   * @returns StatusInfo containing the videoId, overallStatus, durationSec, and steps
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getWorkerStatus(videoId: string): Promise<StatusInfo> {
    const statusRow = await this.statusRepository.findOne({
      where: { videoId },
      relations: { statusEvent: true },
    });

    const steps = await this.stepStatusRepository.find({
      where: { videoId },
    });

    return {
      videoId,
      overallStatus: statusRow?.statusEvent?.status ?? null,
      durationSec: statusRow?.durationSec ?? null,
      steps: steps.map((s) => ({
        step: s.step,
        status: s.status,
      })),
    };
  }

  /**
   * Gets the worker step status for a given video and step.
   * @param videoId - ID of the video
   * @param step - The step to get the status for
   * @returns StepStatusInfo containing the videoId, step, status, attempts, durationSec
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getWorkerStepStatus(
    videoId: string,
    step: string,
  ): Promise<StepStatusInfo> {
    let stepRow: VideoWorkerStepStatus | null;
    try {
      stepRow = await this.stepStatusRepository.findOne({
        where: { videoId, step },
      });
    } catch (error) {
      this.logger.error('Failed to load worker step status', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      videoId,
      step,
      status: stepRow?.status ?? null,
      durationSec: stepRow?.durationSec ?? null,
      attempts: stepRow?.attempts ?? 0,
      lastError: stepRow?.lastError ?? null,
    };
  }
}
