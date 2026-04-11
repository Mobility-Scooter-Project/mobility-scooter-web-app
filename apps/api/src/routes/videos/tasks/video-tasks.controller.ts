import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import {
  CreateVideoTaskDto,
  UpdateVideoTaskDto,
} from './video-tasks.dto';
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

  @Post(':videoId/tasks')
  async createVideoTask(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() body: CreateVideoTaskDto,
  ) {
    return this.videoTasksService.createVideoTask(
      req.locals.userId,
      videoId,
      body,
    );
  }

  @Patch(':videoId/tasks/:taskId')
  async updateVideoTask(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: UpdateVideoTaskDto,
  ) {
    return this.videoTasksService.updateVideoTask(
      req.locals.userId,
      videoId,
      taskId,
      body,
    );
  }

  @Delete(':videoId/tasks/:taskId')
  async deleteVideoTask(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.videoTasksService.deleteVideoTask(
      req.locals.userId,
      videoId,
      taskId,
    );
  }
}
