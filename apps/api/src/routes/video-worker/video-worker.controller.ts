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
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { VIDEO_WORKER_COMPLETED_STEPS } from '@config/enums';
import {
  VideoWorkerCompletedDto,
  VideoWorkerStepCompletedDto,
} from './video-worker-status.dto';
import { VideoWorkerService } from './video-worker.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

@Controller('video-worker')
export class VideoWorkerController {
  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly videoWorkerService: VideoWorkerService,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  // Get overallstatus for a video.
  @Get(':videoId/status')
  async getStatus(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      req.locals.userId,
      videoId,
    );
    return this.videoWorkerService.getWorkerStatus(videoId);
  }

  // Get status for a single processing step for a video.
  @Get(':videoId/:step/status')
  async getStepStatus(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('step', new ParseEnumPipe(VIDEO_WORKER_COMPLETED_STEPS))
    step: VIDEO_WORKER_COMPLETED_STEPS,
  ) {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      req.locals.userId,
      videoId,
    );
    return this.videoWorkerService.getWorkerStepStatus(videoId, step);
  }

  // Internal completion webhook used by worker when processing is done.
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

  // Internal webhook when `pose_estimation` or `task_detection` reaches completion.
  @Post('step-completed')
  @HttpCode(200)
  async markStepCompleted(
    @Body() body: VideoWorkerStepCompletedDto,
    @Headers('X-Video-Worker-Secret') secretHeader?: string,
  ) {
    const expectedSecret = this.configService.get('videoWorkerSecret');

    if (expectedSecret) {
      if (!secretHeader || secretHeader !== expectedSecret) {
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    return this.videoWorkerService.markStepCompleted(body);
  }
}
