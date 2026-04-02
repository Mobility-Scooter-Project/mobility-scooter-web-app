import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import {
  VideoWorkerCompletedDto,
  VideoWorkerStepCompletedDto,
} from './video-worker-status.dto';
import { VideoWorkerSseService } from './sse/video-worker-sse.service';

type StepStatusInfo = {
  videoId: string;
  step: string;
  status: string | null;
  durationSec: number | null;
  attempts: number;
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

type CompletionResponse = StatusInfo & {
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
   * This handler only validates, logs, and returns canonical state so the API
   * can later hook side effects (e.g. notify clients, unlock tasks) without
   * duplicating `video_worker` writes.
   *
   * @param dto - VideoWorkerCompletedDto (videoId, durationSec, overallStatus)
   * @returns CompletionResponse containing the videoId, overallStatus, durationSec, and steps
   * @throws HttpException with appropriate status code and message on failure
   */
  public async markVideoCompleted(
    dto: VideoWorkerCompletedDto,
  ): Promise<CompletionResponse> {
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

    const status = await this.getWorkerStatus(dto.videoId);

    // emit event / enqueue work so client knows the video is completed
    this.videoWorkerSseService.emit({
      type: 'overall',
      videoId: dto.videoId,
      overallStatus: status.overallStatus,
      durationSec: status.durationSec,
      steps: status.steps,
    });

    return { ...status, acknowledged: true };
  }

  /**
   * Mark a step as completed.
   * @param dto - VideoWorkerStepCompletedDto (videoId, step, durationSec)
   * @returns StepCompletionResponse containing the videoId, step, status, attempts, durationSec, and acknowledged
   * @throws HttpException with appropriate status code and message on failure
   */
  public async markStepCompleted(
    dto: VideoWorkerStepCompletedDto,
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
      `Step webhook: videoId=${dto.videoId} step=${dto.step} durationSec=${dto.durationSec}`,
    );

    const step_status = await this.getWorkerStepStatus(dto.videoId, dto.step);

    // emit event / enqueue work so client knows the step is completed and UI can show tasks
    this.videoWorkerSseService.emit({
      type: 'step',
      videoId: dto.videoId,
      step: step_status.step,
      status: step_status.status,
      durationSec: step_status.durationSec,
      attempts: step_status.attempts,
    });

    return {
      ...step_status,
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

    // If the step row doesn't exist yet, surface a null status instead of 404
    return {
      videoId,
      step,
      status: stepRow?.status ?? null,
      durationSec: stepRow?.durationSec ?? null,
      attempts: stepRow?.attempts ?? 0,
    };
  }
}
