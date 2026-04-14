import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { S3Service } from '@infra/openstack/s3/s3.service';
import { SwiftService } from '@infra/openstack/swift/swift.service';
import { QueueService } from '@infra/queue/queue.service';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { File } from '@infra/db/entity/unit/file';
import { PatientSession } from '@infra/db/entity/video/session';
import { Video } from '@infra/db/entity/video/video';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ReprocessVideoDto,
  UpdateVideoTitleDto,
  VideoMetadataDto,
} from './videos.dto';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';

type VideoMetadataOutput = {
  id: string;
};

export type GetVideoOutput = {
  videoId: string;
  title: string;
  fileName: string;
};

/** Shape used when we only need the stored file path (object key) and unit for auth. */
type VideoWithPath = {
  file: { path: string };
  session: { patient: { uuid: string }; unit: { id: string } };
};

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
    @InjectRepository(PatientSession)
    private readonly patientSessionRepository: Repository<PatientSession>,
    private readonly unitAuthorizationService: UnitAuthorizationService,
  ) {}

  /**
   * Create metadata records for a video file and associate it with a session and patient.
   *
   * This method:
   * 1. Constructs a storage path of the form `patients/{patientUuid}/sessions/{sessionId}/{fileName}`.
   * 2. Creates and persists a File entity (with name = `fileName`, type `video/mp4`, and the path).
   * 3. Creates and persists a Video entity (with display `title`) referencing the saved File and session.
   * 4. Returns the id of the created Video metadata.
   *
   * The sessionId must reference an existing row in videos.patient_session (e.g. from seed or POST /units/:unitId/sessions).
   *
   * @param userId - ID of the user creating the video metadata.
   * @param dto - `patientUuid` is internal `Patient.uuid` from session create; plus `sessionId`, storage `fileName`, and display `title`.
   * @returns A promise that resolves to a VideoMetadataOutput containing the id of the created video record.
   *
   * @throws {HttpException} Throws an HttpException with status INTERNAL_SERVER_ERROR if persisting
   * the File or Video entities fails. Errors are logged prior to throwing.
   *
   * @async
   */
  public async createVideoMetadata(
    userId: string,
    dto: VideoMetadataDto,
  ): Promise<VideoMetadataOutput> {
    let session: PatientSession | null;
    try {
      session = await this.patientSessionRepository.findOne({
        where: { id: dto.sessionId },
        relations: { unit: true, patient: true },
      });
    } catch (error) {
      this.logger.error('Failed to load session for video metadata', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!session) {
      this.logger.warn(
        `Session ${dto.sessionId} not found for create video metadata`,
      );
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      session.unit.id,
    );

    if (session.patient.uuid !== dto.patientUuid) {
      this.logger.warn(
        `patientUuid ${dto.patientUuid} does not match session ${dto.sessionId} patient`,
      );
      throw new HttpException(
        'Patient does not match session',
        HttpStatus.FORBIDDEN,
      );
    }

    const path = `patients/${dto.patientUuid}/sessions/${dto.sessionId}/${dto.fileName}`;

    const newFile = this.fileRepository.create({
      name: dto.fileName,
      type: 'video/mp4',
      path,
      uploadedBy: { id: userId },
      unit: { id: session.unit.id },
    });

    let videoFile: File;
    try {
      videoFile = await this.fileRepository.save(newFile);
    } catch (error) {
      this.logger.error('Error creating file metadata', error);
      throw new HttpException(
        'Error creating file metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const newVideo = this.videoRepository.create({
      session: { id: dto.sessionId },
      file: videoFile,
      title: dto.title ?? '',
    });

    let savedVideo: Video;
    try {
      savedVideo = await this.videoRepository.save(newVideo);
    } catch (error) {
      this.logger.error('Error creating video metadata', error);
      throw new HttpException(
        'Error creating video metadata',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { id: savedVideo.id };
  }

  /**
   * Returns persisted metadata for a video.
   * 
   * @param userId - ID of the user getting the video
   * @param videoId - ID of the video
   * @returns Video with videoId, title, and fileName (storage basename)
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getVideo(
    userId: string,
    videoId: string,
  ): Promise<GetVideoOutput> {
    let video: Video | null;
    try {
      video = await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { unit: true } },
        select: {
          id: true,
          title: true,
          file: { name: true },
          session: { id: true, unit: { id: true } },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      this.logger.warn(`Video ${videoId} not found`);
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );

    return {
      videoId: video.id,
      title: video.title,
      fileName: video.file.name,
    };
  }

  public async updateVideoTitle(
    userId: string,
    videoId: string,
    dto: UpdateVideoTitleDto,
  ): Promise<GetVideoOutput> {
    let video: Video | null;
    try {
      video = await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { unit: true } },
        select: {
          id: true,
          title: true,
          file: { name: true },
          session: { id: true, unit: { id: true } },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching video for title update', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      this.logger.warn(`Video ${videoId} not found for title update`);
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );

    try {
      await this.videoRepository.update({ id: videoId }, { title: dto.title });
    } catch (error) {
      this.logger.error('Failed to save video title', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      videoId: video.id,
      title: dto.title,
      fileName: video.file.name,
    };
  }

  /**
   * Uploads a video file to object storage, generates presigned URLs for access and transcript upload,
   * and enqueues a message for downstream processing.
   *
   * This method:
   * - Loads video metadata (including stored file path) from the repository.
   *   - If repository lookup fails an HttpException(400) with message "Invalid input" is thrown.
   *   - If no video is found, HttpException(404) is thrown.
   * - Validates that the incoming Multer file contains a Buffer; if missing, throws HttpException(400).
   * - Converts the Multer buffer into a readable stream and uploads it to the configured object storage
   *   using putObjectStream().
   * - Derives a transcript path by replacing a trailing `.mp4` with `.csv`.
   * - Requests two presigned URLs from the S3 abstraction:
   *   - a GET presigned URL for the uploaded video (24-hour expiry).
   *   - a PUT presigned URL for uploading the transcript (configurable expiry, here set to 24 hours).
   *   - a GET presigned URL for the transcript (24-hour expiry).
   * - Publishes a message to the "videos" topic containing the video id, the presigned video URL,
   *   the original filename/path, and the transcript PUT URL.
   *
   * Notes:
   * - The object storage destination path is the stored file path.
   * - The method is asynchronous and returns a Promise that resolves once the upload and enqueue operations
   *   have been initiated/completed.
   *
   * @param userId - ID of the user uploading the video.
   * @param videoId - The id of the video record to associate with this upload.
   * @param file - The uploaded file provided by Multer (expects file.buffer to be present).
   *
   * @throws {HttpException} When repository fetch fails (invalid input) or when file.buffer is missing.
   *
   * @returns Promise<void> - Resolves when the upload and queueing steps complete.
   */
  public async uploadVideo(
    userId: string,
    videoId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true, unit: true } },
        select: {
          file: { id: true, path: true },
          session: { id: true, patient: { uuid: true }, unit: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      this.logger.warn(`Video ${videoId} not found for upload`);
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );

    const filePath = video.file.path;
    const objectFilePath = filePath;

    // Convert buffer to readable stream since multer stores file as buffer
    if (!file.buffer) {
      this.logger.warn(`Upload for video ${videoId}: missing file buffer`);
      throw new HttpException('No file buffer found', HttpStatus.BAD_REQUEST);
    }

    const fileStream = Readable.from(file.buffer);

    await this.objectStorage.putObjectStream(objectFilePath, fileStream);

    const expires = 60 * 60 * 24;

    const transcriptPath = filePath.replace(/\.mp4$/, '.csv');

    const videoDataPromise = this.s3.presignedUrl(
      'GET',
      objectFilePath,
      expires,
    );

    const transcriptPutUrlPromise = this.s3.presignedUrl(
      'PUT',
      transcriptPath,
      expires,
    );

    const transcriptGetUrlPromise = this.s3.presignedUrl(
      'GET',
      transcriptPath,
      expires,
    );

    const [videoUrl, transcriptPutUrl, transcriptGetUrl] = await Promise.all([
      videoDataPromise,
      transcriptPutUrlPromise,
      transcriptGetUrlPromise,
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
            transcriptGetUrl,
          }),
        },
      ],
    });
  }

  /**
   * Generate a presigned GET URL for a stored video file.
   *
   * This method fetches video metadata from the repository (including the associated
   * file path from the stored `File` row), and returns a presigned GET URL valid for 24 hours.
   *
   * The function handles repository lookup errors and missing video records:
   * - If an error occurs while querying the repository, an HttpException with status 400 is thrown.
   * - If no video is found for the provided id, an HttpException with status 404 is thrown.
   *
   * The S3 presigned URL is generated by calling `this.s3.presignedUrl('GET', objectKey, ttlSeconds)`
   * with a TTL of 60 * 60 * 24 (24 hours). Any errors thrown by the S3 client will propagate to the caller.
   *
   * @param userId - ID of the user generating the presigned URL.
   * @param videoId - The unique identifier of the video to generate a presigned URL for.
   * @returns A promise that resolves to the presigned URL string.
   *
   * @throws {HttpException} When the repository query fails (400) or the video is not found (404).
   * @throws {Error} Propagates errors from the S3 client used to generate the presigned URL.
   *
   * @remarks
   * - Expects the repository query to return the video with relations: file.path.
   * - The constructed object key uses the stored file path.
   */
  async getVideoPresignedUrl(userId: string, videoId: string): Promise<string> {
    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true, unit: true } },
        select: {
          file: { id: true, path: true },
          session: { id: true, patient: { uuid: true }, unit: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      this.logger.warn(`Video ${videoId} not found for presigned URL`);
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );

    const objectFilePath = video.file.path;
    const expires = 60 * 60 * 24; // 24 hours

    return await this.s3.presignedUrl('GET', objectFilePath, expires);
  }

  /**
   * Enqueue a video for reprocessing (keypoints, transcription, and/or task detection).
   *
   * Loads video metadata (file path, patient id) via VideoWithPath-shaped query, builds object path
   * and transcript path, requests presigned URLs, and sends a message to the "videos" topic with
   * optional `steps` to limit which pipeline steps run.
   *
   * @param userId - ID of the user reprocessing the video.
   * @param videoId - The id of the video to reprocess.
   * @param dto - Optional `steps` to limit pipeline runs.
   * @throws HttpException 400 on repo error, 404 when video not found.
   */
  public async reprocessVideo(
    userId: string,
    videoId: string,
    dto: ReprocessVideoDto,
  ): Promise<void> {
    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true, unit: true } },
        select: {
          file: { id: true, path: true },
          session: { id: true, patient: { uuid: true }, unit: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata for reprocess', error);
      throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      this.logger.warn(`Video ${videoId} not found for reprocess`);
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

    await this.unitAuthorizationService.assertUserInUnit(
      userId,
      video.session.unit.id,
    );

    const filePath = video.file.path;
    const objectFilePath = filePath;
    const transcriptPath = filePath.replace(/\.mp4$/, '.csv');
    const expires = 60 * 60 * 24;

    const [videoUrl, transcriptPutUrl, transcriptGetUrl] = await Promise.all([
      this.s3.presignedUrl('GET', objectFilePath, expires),
      this.s3.presignedUrl('PUT', transcriptPath, expires),
      this.s3.presignedUrl('GET', transcriptPath, expires),
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
            transcriptGetUrl,
            ...(dto.steps && { steps: dto.steps }),
          }),
        },
      ],
    });
  }
}
