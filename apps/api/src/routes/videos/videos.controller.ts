import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoMetadataDto, ReprocessVideoDto } from './videos.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('videos')
export class VideosController {
  private logger: Logger = new Logger(VideosController.name);

  constructor(private readonly videosService: VideosService) {}

  @Post('upload')
  async uploadVideo(
    @Req() req: { locals: { userId: string } },
    @Body() body: VideoMetadataDto,
  ) {
    return this.videosService.createVideoMetadata(req.locals.userId, body);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post(':videoId/upload')
  async upload(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(
      `Uploading file for videoId: ${videoId}, originalname: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`,
    );
    return this.videosService.uploadVideo(req.locals.userId, videoId, file);
  }

  @Post(':videoId/reprocess')
  async reprocessVideo(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() body: ReprocessVideoDto,
  ) {
    this.logger.log(`Reprocessing videoId: ${videoId}, steps: ${body.steps}`);
    return this.videosService.reprocessVideo(req.locals.userId, videoId, body);
  }

  @Get(':videoId/download')
  async getPresignedUrl(
    @Req() req: { locals: { userId: string } },
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    return this.videosService.getVideoPresignedUrl(req.locals.userId, videoId);
  }
}
