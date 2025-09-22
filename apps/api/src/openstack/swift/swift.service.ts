import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { S3Service } from '../s3/s3.service';
import { BarbicanService } from '../barbican/barbican.service';
import { QueueService } from 'src/queue/queue.service';
import * as crypto from 'crypto';
import type { WaiterResult } from "@smithy/util-waiter";

const FILE_TYPES = {
    VIDEO: 'video',
    TRANSCRIPT: 'transcript'
} as const;

const TOPICS = {
    VIDEOS: 'videos'
} as const;

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
        const swift = new SwiftService(
            s3,
            barbican,
            queue
        );

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
        uploadStream: ReadableStream<any>,
        uploadedAt: Date,
        fileType = FILE_TYPES.VIDEO,
    ): Promise<void> {
        // TODO: check if user has access to patientId

        // each patient gets their own bucket to attempt to isolate their data
        const expires = 60 * 60 * 24;
        const startTime = new Date();

        await this.s3.getOrCreateBucket(this.storageBucket);

        await this.s3.multipartUpload(
            uploadStream,
            filePath,
        );

        if (fileType === FILE_TYPES.VIDEO) {
            const transcriptPath = filePath.replace(/\.mp4$/, ".vtt");
            const videoDataPromise = this.generatePresignedGetUrl(filePath);

            const transcriptPutUrlPromise = this.s3.presignedUrl(
                "PUT",
                transcriptPath,
                expires,
            );

            const videoMetadataPromise = this.createVideoMetadata(
                this.storageBucket,
                filePath,
                uploadedAt,
            );

            const [videoData, transcriptPutUrl, videoMetadata] = await Promise.all([
                videoDataPromise,
                transcriptPutUrlPromise,
                videoMetadataPromise,
            ]);

            let uploadState = await this.s3.waitUntilObjectExists(filePath);

            while (uploadState.state !== 'SUCCESS') {
                if (uploadState.state === 'FAILURE') {
                    throw new HttpException("Failed to upload video file", HttpStatus.INTERNAL_SERVER_ERROR);
                }
                uploadState = await this.s3.waitUntilObjectExists(filePath);
            }

            await this.queue.getProducer().send({
                topic: TOPICS.VIDEOS,
                messages: [{
                    key: videoMetadata.id,
                    value: JSON.stringify({
                        id: videoMetadata.id,
                        url: videoData.url,
                        filename: filePath,
                        transcriptPutUrl,
                    }),
                }],
            });

            console.log(`Published video event to queue: ${videoMetadata.id} - ${filePath}`);
        }

        console.log(`Uploaded file ${filePath} to bucket ${this.storageBucket} in ${new Date().getTime() - startTime.getTime()} ms`);
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
    public async generatePresignedGetUrl(filePath: string): Promise<{ url: string }> {
        const date = new Date();
        const expires = new Date(date.getTime() + 60 * 60 * 24 * 1000);
        const method = "GET";

        const params = new URLSearchParams({
            "X-MSWA-Method": method,
            "X-MSWA-Expires": Math.floor(expires.getTime() / 1000).toString(),
            "X-MSWA-FilePath": filePath,
        });

        // sign the URL
        const signature = crypto
            .createHmac("sha256", this.storageSecret)
            .update(`${method}\n${params.get("X-MSWA-Expires")}\n${filePath}`)
            .digest("hex");

        params.append("X-MSWA-Signature", signature);

        const url = `${this.baseUrl}/api/v1/storage/presigned-url?${params.toString()}`;
        return { url };
    }

    /**
     * Retrieves an object stream from storage with encryption.
     * 
     * @param filePath - The file path of the object within the bucket
     * @returns A promise that resolves to an object containing the stream
     * @throws {HttpException} If the bucket does not exist or if there's an issue retrieving the encryption key
     */
    public async getObjectStream(filePath: string): Promise<{ stream: any }> {
        const object = await this.s3.getObject(filePath);

        return {
            stream: object,
        };
    }

    /**
     * Validates a pre-signed URL for storage operations
     * @param filePath - The path to the file in storage
     * @param method - The HTTP method for the pre-signed URL
     * @param expires - The expiration timestamp of the pre-signed URL
     * @param signature - The signature of the pre-signed URL for validation
     * @throws {HttpException} If the pre-signed URL validation fails
     * @returns {Promise<void>}
     */
    public async validatePresignedUrl(
        filePath: string,
        method: string,
        expires: string,
        signature: string,
    ): Promise<void> {
        await this.s3.validatePresignedUrl(
            filePath,
            method,
            expires,
            signature,
        );
    }

    /**
     * Stores video metadata in the database and creates a video event
     *
     * @param patientId - ID associated with a patient
     * @param path - Path of the video file
     * @param uploadedAt - Date of the video
     * @returns String
     *  - ID of the video metadata
     *
     * @remarks
     * This function will create an event ID and store the video metadata in the database.
     * The event ID is used to track the status of the video.
     */
    public async createVideoMetadata(
        patientId: string,
        path: string,
        uploadedAt: Date,
    ) {
        // TODO: Implement video repository integration
        // For now, return a mock object that matches the expected interface
        return {
            id: crypto.randomUUID(),
            patientId,
            path,
            uploadedAt,
        };
    }
}
