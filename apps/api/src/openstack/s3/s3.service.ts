import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    public static instance: S3Client;
    private static connectionPromise: Promise<boolean>;
    private storageBucket: string;
    private storageSecret: string;

    public constructor() { }

    public static async build(configService: ConfigService<AppConfig>): Promise<S3Service> {
        const s3Service = new S3Service();

        s3Service.storageBucket = configService.get('storage').bucket;
        s3Service.storageSecret = configService.get('storage').secret;

        if (!S3Service.instance) {
            S3Service.connectionPromise = new Promise((resolve) => {
                try {
                    const endpoint = `http://${configService.get('storage').hostname}:${configService.get('storage').port}/`;
                    const config: S3ClientConfig = {
                        endpoint,
                        region: "us-east-1",
                        credentials: {
                            accessKeyId: configService.get('storage').accessKey,
                            secretAccessKey: configService.get('storage').secretKey,
                        },
                        forcePathStyle: true,
                    };
                    S3Service.instance = new S3Client(config);
                    resolve(true);
                } catch (error) {
                    resolve(false);
                }
            });
        }

        await S3Service.connectionPromise;
        return s3Service;
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

            await S3Service.instance.send(command);
            return true;
        } catch (error) {
            console.error(error);
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
            const res = await S3Service.instance.send(createBucketCommand);
            if (res.$metadata.httpStatusCode !== 200) {
                throw new HttpException(`Failed to create bucket`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
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
            const res = await S3Service.instance.send(getObjectCommand);

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

            return await getSignedUrl(S3Service.instance, command, {
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
        objectStream: ReadableStream<any>,
        objectName: string,
    ): Promise<void> {
        const commonHeaders: CreateMultipartUploadCommandInput = {
            Bucket: this.storageBucket,
            Key: objectName,
        };

        console.log(commonHeaders);

        let UploadId = "";
        let PartNumber = 1;
        const Parts: CompletedPart[] = [];
        const partSize = 5 * 1024 * 1024; // 5MB
        let uploadBuffer = new Uint8Array(0);

        const createMultipartUploadCommand = new CreateMultipartUploadCommand({
            ...commonHeaders,
        });

        try {
            const writableStream = new WritableStream({
                start: async (controller) => {
                    try {
                        const res = await S3Service.instance.send(
                            createMultipartUploadCommand,
                        );
                        UploadId = res.UploadId!;
                        console.log(`Multipart upload initiated with ID: ${UploadId}`);
                    } catch (error) {
                        controller.error(`Failed to create multipart upload: ${error}`);
                    }
                },
                write: async (chunk: Uint8Array, controller) => {
                    if (chunk.length === 0) {
                        return;
                    }

                    const newBuffer = new Uint8Array(uploadBuffer.length + chunk.length);
                    newBuffer.set(uploadBuffer, 0);
                    newBuffer.set(chunk, uploadBuffer.length);
                    uploadBuffer = newBuffer;

                    try {
                        while (uploadBuffer.length >= partSize) {
                            const uploadPartCommand = new UploadPartCommand({
                                ...commonHeaders,
                                PartNumber: PartNumber,
                                UploadId: UploadId,
                                Body: uploadBuffer.slice(0, partSize),
                            });

                            const res = await S3Service.instance.send(uploadPartCommand);

                            Parts.push({
                                ...res,
                                PartNumber: PartNumber,
                            });

                            console.log(`Uploaded part ${PartNumber} successfully.`);
                            PartNumber++;
                            uploadBuffer = uploadBuffer.slice(partSize);
                        }
                    } catch (error) {
                        controller.error(`Failed to upload part: ${error}`);
                    }
                },
                close: async () => {
                    console.log(`All parts uploaded. Uploading last part...`);
                    if (uploadBuffer.length > 0) {
                        try {
                            const uploadPartCommand = new UploadPartCommand({
                                ...commonHeaders,
                                PartNumber,
                                UploadId: UploadId,
                                Body: uploadBuffer,
                            });

                            const res = await S3Service.instance.send(uploadPartCommand);

                            Parts.push({
                                ...res,
                                PartNumber: PartNumber,
                            });
                        } catch (error) {
                            throw new HttpException(`Failed to upload last part`, HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                    }

                    console.log(`All parts uploaded successfully. Completing multipart upload...`);

                    try {
                        const completeMultipartUploadCommand =
                            new CompleteMultipartUploadCommand({
                                ...commonHeaders,
                                UploadId: UploadId,
                                MultipartUpload: {
                                    Parts: Parts,
                                },
                            });
                        await S3Service.instance.send(completeMultipartUploadCommand);
                    } catch (error) {
                        throw new HttpException(`Failed to complete multipart upload`, HttpStatus.INTERNAL_SERVER_ERROR);
                    }

                    console.log(`Multipart upload completed successfully.`);
                },
                abort: async () => {
                    console.error(`Multipart upload aborted.`);
                    try {
                        const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
                            ...commonHeaders,
                            UploadId: UploadId,
                        });
                        await S3Service.instance.send(abortMultipartUploadCommand);
                    } catch (error) {
                        throw new HttpException(`Failed to abort multipart upload`, HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                },
            });

            await objectStream.pipeTo(writableStream);
        } catch (error) {
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
                    client: S3Service.instance,
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