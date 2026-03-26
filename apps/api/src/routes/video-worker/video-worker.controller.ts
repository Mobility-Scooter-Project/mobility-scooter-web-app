import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { VIDEO_WORKER_STEPS } from '@config/enums';
import { VideoWorkerCompletedDto } from './video-worker-status.dto';
import { VideoWorkerService } from './video-worker.service';

@Controller('video-worker')
export class VideoWorkerController {
  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly videoWorkerService: VideoWorkerService,
  ) {}

  /** Frontend status polling/read endpoint. */
  @Get(':videoId/status')
  async getStatus(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.videoWorkerService.getWorkerStatus(videoId);
  }

  /** Get status for a single processing step for a video. */
  @Get(':videoId/:step/status')
  async getStepStatus(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('step', new ParseEnumPipe(VIDEO_WORKER_STEPS))
    step: VIDEO_WORKER_STEPS,
  ) {
    return this.videoWorkerService.getWorkerStepStatus(videoId, step);
  }

  /** Internal completion webhook used by worker when processing is done. */
  @Post('completed')
  @HttpCode(200)
  async markCompleted(
    @Body() body: VideoWorkerCompletedDto,
    @Headers('X-Video-Worker-Secret') secretHeader?: string,
  ) {
    const expectedSecret = this.configService.get('videoWorkerSecret');

    // If configured, enforce a shared-secret header.
    if (expectedSecret) {
      if (!secretHeader || secretHeader !== expectedSecret) {
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    return this.videoWorkerService.markVideoCompleted(body);
  }
}
