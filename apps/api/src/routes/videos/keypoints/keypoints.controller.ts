import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  DEFAULT_MAX_DELTA_SECONDS,
  DEFAULT_SINCE_LIMIT,
  KeypointsService,
} from './keypoints.service';

@Controller('videos')
export class KeypointsController {
  constructor(private readonly keypointsService: KeypointsService) {}

  @Get(':videoId/keypoints/since')
  async getSince(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('afterFrameIndex', new DefaultValuePipe(-1), ParseIntPipe)
    afterFrameIndex: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_SINCE_LIMIT), ParseIntPipe)
    limit: number,
  ) {
    return this.keypointsService.getSince(
      req.locals.userId,
      videoId,
      afterFrameIndex,
      limit,
    );
  }

  @Get(':videoId/keypoints/nearest')
  async getNearest(
    @Req() req: { locals: { userId: string } },
    @Res() res: Response,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('timestamp', ParseFloatPipe) timestamp: number,
    @Query(
      'maxDeltaSeconds',
      new DefaultValuePipe(DEFAULT_MAX_DELTA_SECONDS),
      ParseFloatPipe,
    )
    maxDeltaSeconds: number,
  ): Promise<void> {
    const row = await this.keypointsService.getNearest(
      req.locals.userId,
      videoId,
      timestamp,
      maxDeltaSeconds,
    );
    res.status(HttpStatus.OK).json(row);
  }
}
