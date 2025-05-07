import {
  STORAGE_ACCESS_KEY,
  STORAGE_PORT,
  STORAGE_SECRET,
  STORAGE_SECRET_KEY,
  STORAGE_URL,
} from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import crypto from "node:crypto";
import { AbortMultipartUploadCommand, CompletedPart, CompleteMultipartUploadCommand, CreateBucketCommand, CreateMultipartUploadCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client, UploadPartCommand, waitUntilObjectExists, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import logger from "../lib/logger";
import type { WaiterResult } from "@smithy/util-waiter"
import { cryptoUtils } from "@src/lib/crypto";

/**
 * A singleton class that manages interactions with a storage service (MinIO).
 * This class provides methods for bucket operations, object storage, and presigned URL handling.
 * 
 * @class Storage
 * @description Handles storage operations including:
 * - Bucket existence checking and creation
 * - Object retrieval with server-side encryption
 * - Presigned URL generation and validation
 * - File upload using presigned URLs
 * 
 * @example
 * ```typescript
 * const storage = new Storage();
 * await storage.getOrCreateBucket('my-bucket');
 * ```
 * 
 * @remarks
 * This class implements a singleton pattern to maintain a single connection to the storage service.
 * It uses server-side encryption for secure object storage and retrieval.
 * 
 * @throws {HTTPError}
 * - HTTP 500 for general storage operation failures
 * - HTTP 404 when bucket is not found
 * - HTTP 401 for authentication/authorization failures
 */
export class Storage {
  public static instance: S3Client;
  private static connectionPromise: Promise<boolean>;

  public constructor() {
    if (!Storage.instance) {
      Storage.connectionPromise = new Promise((resolve) => {
        try {
          Storage.instance = new S3Client({
            endpoint: {
              protocol: "https:",
              hostname: STORAGE_URL,
              port: Number(STORAGE_PORT),
              path: "/",
            },
            region: "us-east-1",
            credentials: {
              accessKeyId: STORAGE_ACCESS_KEY,
              secretAccessKey: STORAGE_SECRET_KEY,
            },
            forcePathStyle: true,
          });

          resolve(true);
        } catch (error) {
          resolve(false);
        }
      });
    }
  }

  /**
   * Retrieves the current connection status of the Storage module.
   *
   * @returns {boolean} `true` if the Storage is connected; otherwise, `false`.
   */
  public static async getConnectionStatus() {
    return Storage.connectionPromise;
  }

  /**
   * Checks if a bucket exists in the storage system.
   * @param bucketName - The name of the bucket to check
   */
  public async bucketExists(bucketName: string) {
    try {
      const command = new HeadBucketCommand({
        Bucket: bucketName,
      })

      await Storage.instance.send(command);
      return true
    } catch (error) {
      logger.debug(error);
      return false;
    }
  }

  public async makeBucket(bucketName: string) {
    await this.bucketExists(bucketName);
    try {
      const createBucketCommand = new CreateBucketCommand({
        Bucket: bucketName,
      });
      const res = await Storage.instance.send(createBucketCommand);
      if (res.$metadata.httpStatusCode !== 200) {
        throw new HTTPError(
          HTTP_CODES.INTERNAL_SERVER_ERROR,
          "Failed to create bucket",
        );
      }
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to create bucket",
      );
    }
  }

  /**
   * Checks if a bucket exists in the storage system and creates it if it doesn't.
   * @param bucketName - The name of the bucket to check/create
   * @throws {HTTPException} - Throws an HTTP 500 error if bucket creation fails
   * @returns {Promise<void>}
   */
  public async getOrCreateBucket(bucketName: string) {
    try {
      const bucketExists = await this.bucketExists(bucketName);
      if (!bucketExists) {
        await this.makeBucket(bucketName);
      }
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to create bucket");
    }
  }

  /**
   * Retrieves an object from the specified bucket in the storage.
   * @param bucketName - The name of the bucket containing the object.
   * @param objectName - The name/path of the object to retrieve.
   * @param encryptionKey - The encryption key used to encrypt the object.
   * @returns A Promise that resolves with the retrieved object.
   * @throws {HTTPException} When the object retrieval fails with a 500 Internal Server Error.
   */
  public async getObject(
    bucketName: string,
    objectName: string,
    encryptionKey: string,
  ) {

    const { encryptionKeyBase64, encryptionKeyMd5Base64 } = cryptoUtils.getEncryptionHeaders(encryptionKey);

    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectName,
        SSECustomerAlgorithm: "AES256",
        SSECustomerKey: encryptionKeyBase64,
        SSECustomerKeyMD5: encryptionKeyMd5Base64,
      });
      const res = await Storage.instance.send(getObjectCommand);

      return res.Body?.transformToWebStream();
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to get object",
      );
    }
  }

  /**
   * Generates a pre-signed URL for performing operations on objects in a specified bucket.
   *
   * @param method - The HTTP method to be allowed on the pre-signed URL (e.g., 'GET', 'PUT')
   * @param bucketName - The name of the bucket containing the object
   * @param objectName - The name/path of the object in the bucket
   * @param expires - The number of seconds until the pre-signed URL expires
   * @param reqParams - Optional parameters for the pre-signed URL request
   * @param requestDate - Optional date to be used for request signing
   * @returns Promise containing the generated pre-signed URL
   * @throws {HTTPException} When URL generation fails with HTTP 500 error
   */
  public async presignedUrl(
    method: "GET" | "PUT",
    bucketName: string,
    objectName: string,
    expires: number,
    reqParams?: {
      SSECustomerAlgorithm?: string;
      SSECustomerKey?: string;
      SSECustomerKeyMD5?: string;
    },
    requestDate?: Date,
  ) {
    try {
      let command;
      let baseRequest = {
        Bucket: bucketName,
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

      return await getSignedUrl(Storage.instance, command, { expiresIn: expires, signingDate: requestDate });
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to generate pre-signed URL",
      );
    }
  }

  /**
   * Uploads a blob object to a pre-signed URL with server-side encryption
   * @param url - The pre-signed URL where the object will be uploaded
   * @param object - The blob object to be uploaded
   * @param encryptionKey - The encryption key in hexadecimal format for server-side encryption
   * @throws {HTTPError} When the upload fails with HTTP 500 Internal Server Error
   */
  public async multipartUpload(
    objectStream: ReadableStream<any>,
    bucketName: string,
    objectName: string,
    encryptionKey: string,
  ) {

    const { encryptionKeyBase64, encryptionKeyMd5Base64 } = cryptoUtils.getEncryptionHeaders(encryptionKey);

    const commonHeaders = {
      Bucket: bucketName,
      Key: objectName,
      SSECustomerAlgorithm: "AES256",
      SSECustomerKey: encryptionKeyBase64,
      SSECustomerKeyMD5: encryptionKeyMd5Base64,
    }

    let UploadId = "";
    let PartNumber = 1;
    const Parts: CompletedPart[] = [];
    const partSize = 5 * 1024 * 1024; // 5MB
    let uploadBuffer = new Uint8Array(0);

    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      ...commonHeaders,
    });

    const writableStream = new WritableStream({
      start: async (controller) => {
        try {
          const res = await Storage.instance.send(createMultipartUploadCommand);
          UploadId = res.UploadId!;
          logger.info(`Multipart upload initiated with ID: ${UploadId}`);
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

            const res = await Storage.instance.send(uploadPartCommand);

            Parts.push({
              ...res,
              PartNumber: PartNumber,
            });

            logger.debug(`Uploaded part ${PartNumber} successfully.`);
            PartNumber++;
            uploadBuffer = uploadBuffer.slice(partSize);
          }
        } catch (error) {
          controller.error(`Failed to upload part: ${error}`);
        }
      },
      close: async () => {
        logger.debug(`All parts uploaded. Uploading last part...`);
        if (uploadBuffer.length > 0) {
          try {
            const uploadPartCommand = new UploadPartCommand({
              ...commonHeaders,
              PartNumber,
              UploadId: UploadId,
              Body: uploadBuffer,
            });

            const res = await Storage.instance.send(uploadPartCommand);

            Parts.push({
              ...res,
              PartNumber: PartNumber,
            });
          } catch (error) {
            throw new HTTPError(
              HTTP_CODES.INTERNAL_SERVER_ERROR,
              error,
              "Failed to upload last part",
            );
          }
        }

        logger.debug(`All parts uploaded successfully. Completing multipart upload...`);

        try {
          const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
            ...commonHeaders,
            UploadId: UploadId,
            MultipartUpload: {
              Parts: Parts,
            },
          });
          await Storage.instance.send(completeMultipartUploadCommand);
        } catch (error) {
          throw new HTTPError(
            HTTP_CODES.INTERNAL_SERVER_ERROR,
            error,
            "Failed to complete multipart upload",
          );
        }

        logger.info(`Multipart upload completed successfully.`);
      },
      abort: async () => {
        logger.error(`Multipart upload aborted.`);
        try {
          const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
            ...commonHeaders,
            UploadId: UploadId,
          });
          await Storage.instance.send(abortMultipartUploadCommand);
        } catch (error) {
          throw new HTTPError(
            HTTP_CODES.INTERNAL_SERVER_ERROR,
            error,
            "Failed to abort multipart upload",
          );
        }
      }
    })

    objectStream.pipeTo(writableStream);
  }

  public waitUntilObjectExists(
    bucketName: string,
    objectName: string,
    encryptionKey: string,
  ): Promise<WaiterResult> {
    const { encryptionKeyBase64, encryptionKeyMd5Base64 } = cryptoUtils.getEncryptionHeaders(encryptionKey);

    try {
      return waitUntilObjectExists({
        client: Storage.instance,
        minDelay: 1,
        maxDelay: 5,
        maxWaitTime: 30,
      }, {
        Bucket: bucketName,
        Key: objectName,
        SSECustomerAlgorithm: "AES256",
        SSECustomerKey: encryptionKeyBase64,
        SSECustomerKeyMD5: encryptionKeyMd5Base64,
      })
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to retriever object waiter",
      );
    }
  }

  /**
   * Validates a presigned URL by checking its signature, expiration, and bucket existence
   * 
   * @param filePath - The path to the file in the storage bucket
   * @param bucketName - The name of the storage bucket
   * @param method - The HTTP method for the presigned URL
   * @param expires - The expiration timestamp in seconds since epoch
   * @param signature - The signature to validate against
   * 
   * @throws {HTTPException} With status 401 if signature is invalid
   * @throws {HTTPException} With status 401 if URL has expired
   * @throws {Error} If bucket does not exist
   * 
   * @returns {Promise<void>} Resolves if validation is successful
   */
  public async validatePresignedUrl(
    filePath: string,
    bucketName: string,
    method: string,
    expires: string,
    signature: string,
  ) {
    const date = new Date();
    const expiresDate = new Date(parseInt(expires) * 1000);

    const expectedSignature = crypto
      .createHmac("sha256", STORAGE_SECRET)
      .update(`${method}\n${expires}\n${filePath}\n${bucketName}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new HTTPError(
        HTTP_CODES.UNAUTHORIZED,
        "Invalid signature",
      );
    }

    if (expiresDate < date) {
      throw new HTTPError(
        HTTP_CODES.UNAUTHORIZED,
        "URL has expired",
      );
    }

    await storage.bucketExists(bucketName);
  }

}

export const storage = new Storage();
