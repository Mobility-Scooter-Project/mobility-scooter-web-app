import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import * as crypto from 'crypto';
import {
    AbortMultipartUploadCommand,
    CompletedPart,
    CompleteMultipartUploadCommand,
    CreateBucketCommand,
    CreateMultipartUploadCommand,
    CreateMultipartUploadCommandInput,
    GetObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client,
    S3ClientConfig,
    UploadPartCommand,
    waitUntilObjectExists,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { WaiterResult } from "@smithy/util-waiter";
import { ReadStream } from 'fs';
import { Readable } from 'stream';

/**
 * A singleton class that manages interactions with a storage service (MinIO/S3).
 * This class provides methods for bucket operations, object storage, and presigned URL handling.
 *
 * @class S3Service
 * @description Handles storage operations including:
 * - Bucket existence checking and creation
 * - Object retrieval with server-side encryption
 * - Presigned URL generation and validation
 * - File upload using presigned URLs
 *
 * @example
 * ```typescript
 * const s3Service = await S3Service.build(configService);
 * await s3Service.getOrCreateBucket('my-bucket');
 * ```
 *
 * @remarks
 * This class implements a singleton pattern to maintain a single connection to the storage service.
 * It uses server-side encryption for secure object storage and retrieval.
 *
 * @throws {HttpException}
 * - HTTP 500 for general storage operation failures
 * - HTTP 404 when bucket is not found
 * - HTTP 401 for authentication/authorization failures
 */
@Injectable()
export class S3Service {
    private storageBucket: string;
    private storageSecret: string;
    private logger: Logger = new Logger(S3Service.name);
    private client: S3Client;

    public constructor(configService: ConfigService<AppConfig>) {
        this.storageBucket = configService.get('storage').bucket;
        this.storageSecret = configService.get('storage').secret;

        const endpoint = `https://${configService.get('storage').hostname}:${configService.get('storage').port}/`;
        const config: S3ClientConfig = {
            endpoint,
            region: "us-east-1",
            credentials: {
                accessKeyId: configService.get('storage').accessKey,
                secretAccessKey: configService.get('storage').secretKey,
            },
            forcePathStyle: true,
        };

        this.client = new S3Client(config);
    }

    /**
     * Checks if a bucket exists in the storage system.
     * @param bucketName - The name of the bucket to check
     */
    public async bucketExists(bucketName: string): Promise<boolean> {
        try {
            const command = new HeadBucketCommand({
                Bucket: bucketName,
            });

            await this.client.send(command);
            return true;
        } catch (error) {
            this.logger.error(error);
            return false;
        }
    }

    /**
     * Creates a new S3 bucket with the specified name.
     * 
     * @param bucketName - The name of the bucket to create
     * @throws {HttpException} Throws an HttpException with INTERNAL_SERVER_ERROR status code if:
     *   - The bucket creation fails (non-200 HTTP status)
     *   - Any other error occurs during the creation process
     * @returns Promise<void> - Resolves when the bucket is successfully created
     */
    public async makeBucket(bucketName: string): Promise<void> {
        try {
            const createBucketCommand = new CreateBucketCommand({
                Bucket: bucketName,
            });
            const res = await this.client.send(createBucketCommand);
            if (res.$metadata.httpStatusCode !== 200) {
                this.logger.error(`Failed to create bucket: ${bucketName}`, res);
                throw new HttpException(`Failed to create bucket`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            this.logger.error(`Error creating bucket: ${bucketName}`, error);
            throw new HttpException(`Failed to create bucket`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Checks if a bucket exists in the storage system and creates it if it doesn't.
     * @param bucketName - The name of the bucket to check/create
     * @throws {HttpException} - Throws an HTTP 500 error if bucket creation fails
     * @returns {Promise<void>}
     */
    public async getOrCreateBucket(bucketName: string): Promise<void> {
        try {
            const bucketExists = await this.bucketExists(bucketName);
            if (!bucketExists) {
                await this.makeBucket(bucketName);
            }
        } catch (error) {
            throw new HttpException(`Failed to create bucket`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves an object from the specified bucket in the storage.
     * @param objectName - The name/path of the object to retrieve.
     * @returns A Promise that resolves with the retrieved object.
     * @throws {HttpException} When the object retrieval fails with a 500 Internal Server Error.
     */
    public async getObject(objectName: string) {
        try {
            const getObjectCommand = new GetObjectCommand({
                Bucket: this.storageBucket,
                Key: objectName,
            });
            const res = await this.client.send(getObjectCommand);

            return res.Body?.transformToWebStream();
        } catch (error) {
            throw new HttpException(`Failed to get object`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generates a pre-signed URL for performing operations on objects in a specified bucket.
     *
     * @param method - The HTTP method to be allowed on the pre-signed URL (e.g., 'GET', 'PUT')
     * @param objectName - The name/path of the object in the bucket
     * @param expires - The number of seconds until the pre-signed URL expires
     * @param reqParams - Optional parameters for the pre-signed URL request
     * @param requestDate - Optional date to be used for request signing
     * @returns Promise containing the generated pre-signed URL
     * @throws {HttpException} When URL generation fails with HTTP 500 error
     */
    public async presignedUrl(
        method: "GET" | "PUT",
        objectName: string,
        expires: number,
        reqParams?: {
            SSECustomerAlgorithm?: string;
            SSECustomerKey?: string;
            SSECustomerKeyMD5?: string;
        },
        requestDate?: Date,
    ): Promise<string> {
        try {
            let command;
            let baseRequest = {
                Bucket: this.storageBucket,
                Key: objectName,
                SSECustomerAlgorithm: reqParams?.SSECustomerAlgorithm,
                SSECustomerKey: reqParams?.SSECustomerKey,
                SSECustomerKeyMD5: reqParams?.SSECustomerKeyMD5,
            };

            switch (method) {
                case "GET":
                    command = new GetObjectCommand(baseRequest);
                    break;
                case "PUT":
                    command = new PutObjectCommand(baseRequest);
                    break;
            }

            return await getSignedUrl(this.client, command, {
                expiresIn: expires,
                signingDate: requestDate,
            });
        } catch (error) {
            throw new HttpException(`Failed to generate pre-signed URL`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Uploads a stream object using multipart upload with server-side encryption
     * @param objectStream - The ReadableStream to be uploaded
     * @param objectName - The name/path of the object in the bucket
     * @throws {HttpException} When the upload fails with HTTP 500 Internal Server Error
     */
    public async multipartUpload(
        objectStream: Readable,
        objectName: string,
    ): Promise<void> {
        // Validate input parameters
        if (!objectStream) {
            this.logger.error('objectStream is undefined or null');
            throw new HttpException('Invalid stream provided', HttpStatus.BAD_REQUEST);
        }

        if (!objectName) {
            this.logger.error('objectName is undefined or null');
            throw new HttpException('Invalid object name provided', HttpStatus.BAD_REQUEST);
        }

        const commonHeaders: CreateMultipartUploadCommandInput = {
            Bucket: this.storageBucket,
            Key: objectName,
        };

        this.logger.log(commonHeaders);

        let UploadId = "";
        let PartNumber = 1;
        const Parts: CompletedPart[] = [];
        const partSize = 5 * 1024 * 1024; // 5MB
        let uploadBuffer = new Uint8Array(0);

        const createMultipartUploadCommand = new CreateMultipartUploadCommand({
            ...commonHeaders,
        });

        try {
            // Initialize multipart upload
            const res = await this.client.send(createMultipartUploadCommand);
            UploadId = res.UploadId!;
            this.logger.log(`Multipart upload initiated with ID: ${UploadId}`);

            // Process stream chunks
            for await (const chunk of objectStream) {
                const chunkArray = new Uint8Array(chunk);

                if (chunkArray.length === 0) {
                    continue;
                }

                const newBuffer = new Uint8Array(uploadBuffer.length + chunkArray.length);
                newBuffer.set(uploadBuffer, 0);
                newBuffer.set(chunkArray, uploadBuffer.length);
                uploadBuffer = newBuffer;

                while (uploadBuffer.length >= partSize) {
                    const uploadPartCommand = new UploadPartCommand({
                        ...commonHeaders,
                        PartNumber: PartNumber,
                        UploadId: UploadId,
                        Body: uploadBuffer.slice(0, partSize),
                    });

                    const partRes = await this.client.send(uploadPartCommand);

                    Parts.push({
                        ...partRes,
                        PartNumber: PartNumber,
                    });

                    this.logger.log(`Uploaded part ${PartNumber} successfully.`);
                    PartNumber++;
                    uploadBuffer = uploadBuffer.slice(partSize);
                }
            }

            // Upload remaining buffer
            this.logger.log(`All parts uploaded. Uploading last part...`);
            if (uploadBuffer.length > 0) {
                const uploadPartCommand = new UploadPartCommand({
                    ...commonHeaders,
                    PartNumber,
                    UploadId: UploadId,
                    Body: uploadBuffer,
                });

                const partRes = await this.client.send(uploadPartCommand);

                Parts.push({
                    ...partRes,
                    PartNumber: PartNumber,
                });
            }

            this.logger.log(`All parts uploaded successfully. Completing multipart upload...`);

            // Complete multipart upload
            const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
                ...commonHeaders,
                UploadId: UploadId,
                MultipartUpload: {
                    Parts: Parts,
                },
            });
            await this.client.send(completeMultipartUploadCommand);

            this.logger.log(`Multipart upload completed successfully.`);
        } catch (error) {
            this.logger.error(`Error during multipart upload:`, error);

            // Abort multipart upload if UploadId exists
            if (UploadId) {
                try {
                    const abortCommand = new AbortMultipartUploadCommand({
                        Bucket: this.storageBucket,
                        Key: objectName,
                        UploadId: UploadId,
                    });
                    await this.client.send(abortCommand);
                    this.logger.log(`Aborted multipart upload with ID: ${UploadId}`);
                } catch (abortError) {
                    this.logger.error(`Failed to abort multipart upload:`, abortError);
                }
            }

            throw new HttpException(`Failed to perform multipart upload`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Waits until an object exists in the S3 bucket.
     * 
     * @param objectName - The key/name of the object to wait for in the S3 bucket
     * @returns A Promise that resolves to a WaiterResult when the object exists or the wait times out
     * @throws {HttpException} Throws an HttpException with INTERNAL_SERVER_ERROR status if the wait operation fails
     * 
     * @example
     * ```typescript
     * const result = await s3Service.waitUntilObjectExists('my-file.txt');
     * if (result.state === 'SUCCESS') {
     *   console.log('Object exists!');
     * }
     * ```
     */
    public waitUntilObjectExists(objectName: string): Promise<WaiterResult> {
        try {
            return waitUntilObjectExists(
                {
                    client: this.client,
                    minDelay: 1,
                    maxDelay: 5,
                    maxWaitTime: 30,
                },
                {
                    Bucket: this.storageBucket,
                    Key: objectName,
                },
            );
        } catch (error) {
            throw new HttpException(`Failed to retrieve object waiter`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Validates a presigned URL by checking its signature, expiration, and bucket existence
     *
     * @param filePath - The path to the file in the storage bucket
     * @param method - The HTTP method for the presigned URL
     * @param expires - The expiration timestamp in seconds since epoch
     * @param signature - The signature to validate against
     *
     * @throws {HttpException} With status 401 if signature is invalid
     * @throws {HttpException} With status 401 if URL has expired
     *
     * @returns {Promise<void>} Resolves if validation is successful
     */
    public async validatePresignedUrl(
        filePath: string,
        method: string,
        expires: string,
        signature: string,
    ): Promise<void> {
        const date = new Date();
        const expiresDate = new Date(parseInt(expires) * 1000);

        const expectedSignature = crypto
            .createHmac("sha256", this.storageSecret)
            .update(`${method}\n${expires}\n${filePath}`)
            .digest("hex");

        if (signature !== expectedSignature) {
            throw new HttpException("Invalid signature", HttpStatus.UNAUTHORIZED);
        }

        if (expiresDate < date) {
            throw new HttpException("URL has expired", HttpStatus.UNAUTHORIZED);
        }
    }
}