import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';

import { VideoTasksService } from './video-tasks.service';

@Controller('videos')
export class VideoTasksController {
  constructor(private readonly videoTasksService: VideoTasksService) {}

  @Get(':videoId/tasks')
  async getVideoTasks(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.videoTasksService.getVideoTasks(req.locals.userId, videoId);
  }
}
