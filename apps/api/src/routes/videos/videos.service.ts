import { HttpException, Injectable, Logger } from '@nestjs/common';
import { S3Service } from '@infra/openstack/s3/s3.service';
import { SwiftService } from '@infra/openstack/swift/swift.service';
import { QueueService } from '@infra/queue/queue.service';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { File } from '@src/infra/db/entity/unit/file';
import { Video } from '@src/infra/db/entity/video/video';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VideosService {
  private logger = new Logger(VideosService.name);

  constructor(
    private readonly queue: QueueService,
    private readonly s3: S3Service,
    private readonly objectStorage: SwiftService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async createVideoMetadata(
    patientId: string,
    sessionId: string,
    fileName: string,
  ) {
    const path = `patients/${patientId}/sessions/${sessionId}/${fileName}`;

    const newFile = this.fileRepository.create({
      name: fileName,
      type: 'video/mp4',
      path,
    });

    let result;
    try {
      result = await this.fileRepository.save(newFile);
    } catch (error) {
      this.logger.error('Error creating file metadata', error);
      throw new HttpException('Error creating file metadata', 500);
    }

    const newVideo = this.videoRepository.create({
      session: { id: sessionId },
      file: result,
    });

    try {
      result = await this.videoRepository.save(newVideo);
    } catch (error) {
      this.logger.error('Error creating video metadata', error);
      throw new HttpException('Error creating video metadata', 500);
    }

    return { id: result.id };
  }

  async uploadVideo(videoId: string, file: Express.Multer.File) {
    let video;
    try {
      video = await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true } },
        select: {
          file: { path: true },
          session: { patient: { id: true } },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, 400);
    }

    /*if (!video) {
      throw new HttpException('Video not found', 404);
    }
    
    Use a mock video for testing since there is no logic to create a patient session at this time.
    */
    if (!video) {
      video = {
        session: { patient: { id: 'test-patient-id' } },
        file: {
          path: 'patients/test-patient-id/sessions/test-session-id/test-video.mp4',
        },
      };
    }

    const filePath = video.file.path;
    const objectFilePath = `${video.session.patient.id}/${filePath}`;

    // Convert buffer to readable stream since multer stores file as buffer
    if (!file.buffer) {
      throw new HttpException('No file buffer found', 400);
    }

    const fileStream = Readable.from(file.buffer);

    await this.objectStorage.putObjectStream(
      objectFilePath,
      fileStream,
      new Date(),
      file.mimetype,
    );

    const transcriptPath = filePath.replace(/\.mp4$/, '.vtt');
    const videoDataPromise = this.s3.presignedUrl(
      'GET',
      objectFilePath,
      60 * 60 * 24, // 24 hours
    );

    const expires = 60 * 60 * 24;

    const transcriptPutUrlPromise = this.s3.presignedUrl(
      'PUT',
      transcriptPath,
      expires,
    );

    const [videoUrl, transcriptPutUrl] = await Promise.all([
      videoDataPromise,
      transcriptPutUrlPromise,
    ]);

    await this.queue.getProducer().send({
      topic: 'videos',
      messages: [
        {
          key: videoId,
          value: JSON.stringify({
            id: videoId,
            url: videoUrl,
            filename: filePath,
            transcriptPutUrl,
          }),
        },
      ],
    });
  }

  async getVideoPresignedUrl(videoId: string): Promise<string> {
    let video;
    try {
      video = await this.videoRepository.find({
        where: { id: videoId },
        relations: { file: true, session: { patient: true } },
        select: {
          file: { path: true },
          session: { patient: { id: true } },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, 400);
    }

    if (!video[0]) {
      throw new HttpException('Video not found', 404);
    }

    const objectFilePath = `${video[0].patientId}/${video[0].path}`;

    return await this.s3.presignedUrl(
      'GET',
      objectFilePath,
      60 * 60 * 24, // 24 hours
    );
  }
}
