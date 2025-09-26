import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import { S3Service } from '../s3/s3.service';
import { BarbicanService } from '../barbican/barbican.service';
import { QueueService } from '../../queue/queue.service';
import * as crypto from 'crypto';
import { Readable } from 'stream';

/**
 * SwiftService provides a high-level interface for storage operations,
 * integrating S3Service for storage, BarbicanService for encryption, and QueueService for messaging.
 *
 * This service implements the StorageService functionality using OpenStack Swift
 * (S3-compatible) backend with encryption and queue integration.
 */
@Injectable()
export class SwiftService {
  private s3: S3Service;
  private barbican: BarbicanService;
  private queue: QueueService;
  private storageBucket: string;
  private storageSecret: string;
  private baseUrl: string;
  private logger = new Logger(SwiftService.name);

  public constructor(
    private readonly S3Service: S3Service,
    private readonly BarbicanService: BarbicanService,
    private readonly QueueService: QueueService,
  ) {
    this.s3 = S3Service;
    this.barbican = BarbicanService;
    this.queue = QueueService;
  }

  public static async build(
    configService: ConfigService<AppConfig>,
    s3: S3Service,
    barbican: BarbicanService,
    queue: QueueService,
  ): Promise<SwiftService> {
    const swift = new SwiftService(s3, barbican, queue);

    swift.storageBucket = configService.get('storage').bucket;
    swift.storageSecret = configService.get('storage').secret;
    swift.baseUrl = configService.get('baseUrl') || 'http://localhost:3000';

    return swift;
  }

  /**
   * Uploads an object to a storage bucket using a presigned URL and encryption.
   *
   * This function performs the following steps:
   * 1. Retrieves or creates the specified storage bucket.
   * 2. Generates a presigned URL for uploading the object to the bucket.
   * 3. Creates an encryption key for the object using the vault service.
   * 4. Uploads the object to the presigned URL with the generated encryption key.
   * 5. Generates a presigned URL for retrieving the object.
   * 6. Publishes a message to the queue with the object's URL and filename.
   *
   * @param filePath - The destination path for the object in the bucket.
   * @param uploadStream - The ReadableStream to be uploaded.
   * @param uploadedAt - The date when the object was uploaded.
   * @param fileType - The type of the file being uploaded (e.g., video, transcript).
   *
   * @returns A promise that resolves once the object has been uploaded and the queue message has been published.
   */
  public async putObjectStream(
    filePath: string,
    uploadStream: Readable,
    uploadedAt: Date,
    fileType = 'video',
  ): Promise<void> {
    const startTime = new Date();

    await this.s3.getOrCreateBucket(this.storageBucket);

    await this.s3.multipartUpload(uploadStream, filePath);

    this.logger.log(
      `Uploaded file ${filePath} to bucket ${this.storageBucket} in ${new Date().getTime() - startTime.getTime()} ms`,
    );
  }

  /**
   * Generates a pre-signed URL for GET operations on stored files
   *
   * @param filePath - The path to the file in storage
   *
   * @returns A Promise that resolves to an object containing the pre-signed URL
   * @returns {Promise<{url: string}>} The pre-signed URL for accessing the file
   *
   * @remarks
   * The generated URL includes several custom headers with a signature for authentication:
   * - X-MSWA-Method: Always "GET" for this function
   * - X-MSWA-Expires: Expiration timestamp (24 hours from generation)
   * - X-MSWA-FilePath: The provided file path
   * - X-MSWA-Bucket: The provided bucket name
   * - X-MSWA-Signature: HMAC-SHA256 signature of the request parameters
   */
  public async generatePresignedGetUrl(filePath: string): Promise<string> {
    const date = new Date();
    const expires = new Date(date.getTime() + 60 * 60 * 24 * 1000);
    const method = 'GET';

    const params = new URLSearchParams({
      'X-MSWA-Method': method,
      'X-MSWA-Expires': Math.floor(expires.getTime() / 1000).toString(),
      'X-MSWA-FilePath': filePath,
    });

    // sign the URL
    const signature = crypto
      .createHmac('sha256', this.storageSecret)
      .update(`${method}\n${params.get('X-MSWA-Expires')}\n${filePath}`)
      .digest('hex');

    params.append('X-MSWA-Signature', signature);

    const url = `${this.baseUrl}/api/v1/uploads/presigned-url?${params.toString()}`;
    return url;
  }
}
