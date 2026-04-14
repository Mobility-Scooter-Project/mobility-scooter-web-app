import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { VideoStabilityService } from './video-stability.service';

@Controller('videos')
export class VideoStabilityController {
  constructor(private readonly videoStabilityService: VideoStabilityService) {}

  @Get(':videoId/stability')
  async getVideoStability(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.videoStabilityService.getVideoStability(req.locals.userId, videoId);
  }
}
