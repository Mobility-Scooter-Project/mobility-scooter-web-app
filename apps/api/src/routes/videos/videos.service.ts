import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { S3Service } from '@infra/openstack/s3/s3.service';
import { SwiftService } from '@infra/openstack/swift/swift.service';
import { QueueService } from '@infra/queue/queue.service';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { File } from '@infra/db/entity/unit/file';
import { Video } from '@infra/db/entity/video/video';
import { InjectRepository } from '@nestjs/typeorm';

type VideoMetadataOutput = {
  id: string;
};

/** Shape used when we only need the stored file path (object key). */
type VideoWithPath = {
  file: { path: string };
  session: { patient: { id: string } };
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
  ) {}

  /**
   * Create metadata records for a video file and associate it with a session and patient.
   *
   * This method:
   * 1. Constructs a storage path of the form `patients/{patientId}/sessions/{sessionId}/{fileName}`.
   * 2. Creates and persists a File entity (with name, MIME type "video/mp4", and the constructed path).
   * 3. Creates and persists a Video entity that references the saved File and the provided session id.
   * 4. Returns the id of the created Video metadata.
   *
   * The sessionId must reference an existing row in videos.patient_session (e.g. from seed or POST /units/:unitId/sessions).
   *
   * @param patientId - The id of the patient that owns the session (used in storage path only).
   * @param sessionId - The id of the session to which the video belongs (must exist).
   * @param fileName - The filename of the uploaded video (used to build the storage path and file metadata).
   * @returns A promise that resolves to a VideoMetadataOutput containing the id of the created video record.
   *
   * @throws {HttpException} Throws an HttpException with status INTERNAL_SERVER_ERROR if persisting
   * the File or Video entities fails. Errors are logged prior to throwing.
   *
   * @async
   */
  public async createVideoMetadata(
    patientId: string,
    sessionId: string,
    fileName: string,
  ): Promise<VideoMetadataOutput> {
    const path = `patients/${patientId}/sessions/${sessionId}/${fileName}`;

    const newFile = this.fileRepository.create({
      name: fileName,
      type: 'video/mp4',
      path,
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
      session: { id: sessionId },
      file: videoFile,
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
   * - Derives a transcript path by replacing the ".mp4" extension with ".csv".
   * - Requests two presigned URLs from the S3 abstraction:
   *   - a GET presigned URL for the uploaded video (24-hour expiry).
   *   - a PUT presigned URL for uploading the transcript (configurable expiry, here set to 24 hours).
   * - Publishes a message to the "videos" topic containing the video id, the presigned video URL,
   *   the original filename/path, and the transcript PUT URL.
   *
   * Notes:
   * - The object storage destination path is the stored file path.
   * - The method is asynchronous and returns a Promise that resolves once the upload and enqueue operations
   *   have been initiated/completed.
   *
   * @param videoId - The id of the video record to associate with this upload.
   * @param file - The uploaded file provided by Multer (expects file.buffer to be present).
   *
   * @throws {HttpException} When repository fetch fails (invalid input) or when file.buffer is missing.
   *
   * @returns Promise<void> - Resolves when the upload and queueing steps complete.
   */
  public async uploadVideo(
    videoId: string,
    file: Express.Multer.File,
  ): Promise<void> {

    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true } },
        select: {
          file: { path: true },
          session: { patient: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      throw new HttpException('Video not found', 404);
    }

    const filePath = video.file.path;
    const objectFilePath = filePath;

    // Convert buffer to readable stream since multer stores file as buffer
    if (!file.buffer) {
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
   * file path and the patient id from the session), constructs the S3 object key as
   * "<patientId>/<filePath>", and returns a presigned GET URL valid for 24 hours.
   *
   * The function handles repository lookup errors and missing video records:
   * - If an error occurs while querying the repository, an HttpException with status 400 is thrown.
   * - If no video is found for the provided id, an HttpException with status 404 is thrown.
   *
   * The S3 presigned URL is generated by calling `this.s3.presignedUrl('GET', objectKey, ttlSeconds)`
   * with a TTL of 60 * 60 * 24 (24 hours). Any errors thrown by the S3 client will propagate to the caller.
   *
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
  async getVideoPresignedUrl(videoId: string): Promise<string> {
    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true } },
        select: {
          file: { path: true },
          session: { patient: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata', error);
      throw new HttpException(`Invalid input`, HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      throw new HttpException('Video not found', 404);
    }

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
   * @param videoId - The id of the video to reprocess.
   * @param steps - Optional list of steps: 'pose_estimation' | 'transcription' | 'task_detection'.
   * @throws HttpException 400 on repo error, 404 when video not found.
   */
  public async reprocessVideo(
    videoId: string,
    steps?: ('pose_estimation' | 'transcription' | 'task_detection')[],
  ): Promise<void> {
    let video: VideoWithPath | null;
    try {
      video = (await this.videoRepository.findOne({
        where: { id: videoId },
        relations: { file: true, session: { patient: true } },
        select: {
          file: { path: true },
          session: { patient: { id: true } },
        },
      })) as VideoWithPath | null;
    } catch (error) {
      this.logger.error('Error fetching video metadata for reprocess', error);
      throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
    }

    if (!video) {
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }

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
            ...(steps && { steps }),
          }),
        },
      ],
    });
  }
}
