import { Body, Controller, Get, Logger, Param, Post, Put, Redirect, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoMetadataDto } from './videos.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('videos')
export class VideosController {
    private readonly videos: VideosService;
    private logger: Logger = new Logger(VideosController.name);

    constructor(
        private readonly videosService: VideosService
    ) {
        this.videos = videosService;
    }

    @Post('upload')
    async uploadVideo(@Body() body: VideoMetadataDto) {
        const { patientId, sessionId, fileName } = body;
        return await this.videos.createVideoMetadata(patientId, sessionId, fileName);
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post(':videoId/upload')
    async upload(@Param('videoId') videoId: string, @UploadedFile() file: Express.Multer.File) {
        this.logger.log(`Uploading file for videoId: ${videoId}, originalname: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);
        return await this.videos.uploadVideo(videoId, file);
    }

    @Get(':videoId/download')
    async getPresignedUrl(@Param('videoId') videoId: string) {
        return await this.videosService.getVideoPresignedUrl(videoId);
    }
}
