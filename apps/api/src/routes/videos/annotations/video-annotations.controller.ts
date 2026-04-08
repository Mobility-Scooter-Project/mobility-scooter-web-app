import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import { VideoAnnotationDto } from './video-annotations.dto';
import { VideoAnnotationsService } from './video-annotations.service';

@Controller('videos')
export class VideoAnnotationsController {
  constructor(private readonly videoAnnotationsService: VideoAnnotationsService) {}

  @Post(':videoId/annotations')
  async create(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() body: VideoAnnotationDto,
  ) {
    return this.videoAnnotationsService.createAnnotation(
      req.locals.userId,
      videoId,
      body,
    );
  }

  @Get(':videoId/annotations')
  async list(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.videoAnnotationsService.getAnnotations(req.locals.userId, videoId);
  }

  @Get(':videoId/annotations/:annotationId')
  async getOne(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('annotationId', ParseUUIDPipe) annotationId: string,
  ) {
    return this.videoAnnotationsService.getAnnotation(
      req.locals.userId,
      videoId,
      annotationId,
    );
  }

  @Put(':videoId/annotations/:annotationId')
  async update(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('annotationId', ParseUUIDPipe) annotationId: string,
    @Body() body: VideoAnnotationDto,
  ) {
    return this.videoAnnotationsService.updateAnnotation(
      req.locals.userId,
      videoId,
      annotationId,
      body,
    );
  }

  @Delete(':videoId/annotations/:annotationId')
  async remove(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Param('annotationId', ParseUUIDPipe) annotationId: string,
  ) {
    return this.videoAnnotationsService.deleteAnnotation(
      req.locals.userId,
      videoId,
      annotationId,
    );
  }
}

