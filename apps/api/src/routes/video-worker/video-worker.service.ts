import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import { VideoWorkerCompletedDto } from './video-worker-status.dto';

export type WorkerStepInfo = {
  step: string;
  status: string;
  attempts: number;
  lastError: string | null;
  durationSec: number | null;
};

export type VideoWorkerResyncResponse = {
  videoId: string;
  overallStatus: string | null;
  durationSec: number | null;
  steps: WorkerStepInfo[];
};

export type VideoWorkerStepStatusResponse = {
  videoId: string;
  step: string;
  status: string | null;
  attempts: number | null;
  lastError: string | null;
  durationSec: number | null;
};

export type VideoWorkerCompletionResponse = VideoWorkerResyncResponse & {
  acknowledged: true;
};

@Injectable()
export class VideoWorkerService {
  private readonly logger = new Logger(VideoWorkerService.name);

  constructor(
    @InjectRepository(VideoWorkerStatus)
    private readonly statusRepository: Repository<VideoWorkerStatus>,
    @InjectRepository(VideoWorkerStepStatus)
    private readonly stepStatusRepository: Repository<VideoWorkerStepStatus>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  /**
   * Completion webhook: worker has already persisted status via `db.py`.
   * This handler only validates, logs, and returns canonical state so the API
   * can later hook side effects (e.g. notify clients, unlock tasks) without
   * duplicating `video_worker` writes.
   * 
   * @param dto - VideoWorkerCompletedDto containing the videoId and durationSec
   * @returns VideoWorkerCompletionResponse containing the videoId, overallStatus, durationSec, and steps
   * @throws HttpException with appropriate status code and message on failure
   */
  public async markVideoCompleted(
    dto: VideoWorkerCompletedDto,
  ): Promise<VideoWorkerCompletionResponse> {
    let video: Video | null;
    try {
      video = await this.videoRepository.findOne({ where: { id: dto.videoId } });
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

    if (dto.durationSec !== undefined) {
      this.logger.log(
        `Completion webhook: videoId=${dto.videoId} worker reported durationSec=${dto.durationSec}`,
      );
    }

    const status = await this.getWorkerStatus(dto.videoId);

    if (status.overallStatus !== 'processed') {
      this.logger.warn(
        `Completion webhook for ${dto.videoId} but DB overallStatus is "${status.overallStatus}"`,
      );
    }

    // Future: emit event / enqueue work so UI can show tasks, etc.

    return { ...status, acknowledged: true };
  }

  /**
   * Gets the worker status for a given video.
   * @param videoId - ID of the video
   * @returns VideoWorkerResyncResponse containing the videoId, overallStatus, durationSec, and steps
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getWorkerStatus(videoId: string): Promise<VideoWorkerResyncResponse> {
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
        attempts: s.attempts,
        lastError: s.lastError,
        durationSec: s.durationSec,
      })),
    };
  }

  /**
   * Gets the worker step status for a given video and step.
   * @param videoId - ID of the video
   * @param step - The step to get the status for
   * @returns VideoWorkerStepStatusResponse containing the videoId, step, status, attempts, lastError, and durationSec
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getWorkerStepStatus(
    videoId: string,
    step: string,
  ): Promise<VideoWorkerStepStatusResponse> {
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

    // If the step row doesn't exist yet, surface a null status instead of 404 so polling clients can keep waiting.
    return {
      videoId,
      step,
      status: stepRow?.status ?? null,
      attempts: stepRow?.attempts ?? null,
      lastError: stepRow?.lastError ?? null,
      durationSec: stepRow?.durationSec ?? null,
    };
  }
}
