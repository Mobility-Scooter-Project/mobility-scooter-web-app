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
  private storageBucket: string;
  private storageSecret: string;
  private baseUrl: string;
  private logger = new Logger(SwiftService.name);

  public constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly S3Service: S3Service,
  ) {
    this.s3 = S3Service;
    this.storageBucket = configService.get('storage').bucket;
    this.storageSecret = configService.get('storage').secret;
    this.baseUrl = configService.get('baseUrl') || 'http://localhost:3000';
  }

  /**
   *  Uploads a file stream to the configured storage bucket.
   *
   * @param filePath - The path where the file will be stored
   * @param uploadStream - A readable stream of the file to be uploaded
   */
  public async putObjectStream(
    filePath: string,
    uploadStream: Readable,
  ): Promise<void> {
    const startTime = new Date();

    await this.s3.getOrCreateBucket(this.storageBucket);

    await this.s3.multipartUpload(uploadStream, filePath);

    this.logger.log(
      `Uploaded file ${filePath} to bucket ${this.storageBucket} in ${new Date().getTime() - startTime.getTime()} ms`,
    );
  }
}
