import { ENVIRONMENT } from "@shared/config/constants";
import {
  STORAGE_ACCESS_KEY,
  STORAGE_PORT,
  STORAGE_SECRET,
  STORAGE_SECRET_KEY,
  STORAGE_URL,
} from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { Client } from "minio";
import { RequestOption } from "minio/dist/main/internal/client";
import crypto from "node:crypto";
import Stream from "node:stream";

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
  public static instance: Client;
  private static isConnected = false;

  public constructor() {
    if (!Storage.instance) {
      try {
        Storage.instance = new Client({
          endPoint: STORAGE_URL,
          port: Number(STORAGE_PORT),
          useSSL: true,
          accessKey: STORAGE_ACCESS_KEY,
          secretKey: STORAGE_SECRET_KEY,
        });

        if (ENVIRONMENT !== "production") {
          Storage.instance.setRequestOptions({
            rejectUnauthorized: false,
          });
        }

        Storage.isConnected = true;
      } catch (error) {
        Storage.isConnected = false;
      }
    }
  }

  /**
   * Retrieves the current connection status of the Storage module.
   *
   * @returns {boolean} `true` if the Storage is connected; otherwise, `false`.
   */
  public static getConnectionStatus() {
    return Storage.isConnected;
  }

  /**
   * Checks if a bucket exists in the storage system.
   * @param bucketName - The name of the bucket to check
   */
  public async bucketExists(bucketName: string) {
    let bucketExists = false;
    try {
      bucketExists = await Storage.instance.bucketExists(bucketName);
    } catch (error) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, error, "Failed to check bucket existence");
    }

    if (!bucketExists) {
      throw new HTTPError(HTTP_CODES.NOT_FOUND, "Bucket not found");
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
      const bucketExists = await Storage.instance.bucketExists(bucketName);
      if (!bucketExists) {
        await Storage.instance.makeBucket(bucketName, "us-east-1");
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
    const encryptionKeyMd5 = crypto.hash(
      "md5",
      Buffer.from(encryptionKey, "hex"),
    );
    const base64EncryptionKey = Buffer.from(encryptionKey, "hex").toString(
      "base64",
    );
    const base64EncryptionKeyMd5 = Buffer.from(
      encryptionKeyMd5,
      "hex",
    ).toString("base64");

    try {
      return await Storage.instance.getObject(bucketName, objectName, {
        SSECustomerAlgorithm: "AES256",
        SSECustomerKey: base64EncryptionKey,
        SSECustomerKeyMD5: base64EncryptionKeyMd5,
      });
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
    method: string,
    bucketName: string,
    objectName: string,
    expires: number,
    reqParams?: Parameters<Client["presignedUrl"]>[4],
    requestDate?: Date,
  ) {
    try {
      return await Storage.instance.presignedUrl(
        method,
        bucketName,
        objectName,
        expires,
        reqParams,
        requestDate,
      );
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
  public async uploadToPresignedUrl(
    url: string,
    object: ReadableStream<any>,
    objectSize: number,
    encryptionKey: string,
  ) {
    try {
      const encryptionKeyMd5 = crypto.hash(
        "md5",
        Buffer.from(encryptionKey, "hex"),
      );
      const encryptionKeyBase64 = Buffer.from(encryptionKey, "hex").toString(
        "base64",
      );
      const encryptionKeyMd5Base64 = Buffer.from(
        encryptionKeyMd5,
        "hex",
      ).toString("base64");

      const response = await fetch(url, {
        method: "PUT",
        body: object,
        headers: {
          "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
          "X-Amz-Server-Side-Encryption-Customer-Key": encryptionKeyBase64,
          "X-Amz-Server-Side-Encryption-Customer-Key-MD5":
            encryptionKeyMd5Base64,
          "Content-Length": objectSize.toString(),
        },
        // @ts-ignore
        duplex: "half",
      });

      if (!response.ok) {
        throw new HTTPError(
          HTTP_CODES.INTERNAL_SERVER_ERROR,
          await response.text(),
          "Failed to upload to pre-signed URL",
        );
      }

    } catch (error) {
      console.error("Error uploading to pre-signed URL:", error);
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to upload to pre-signed URL",
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

  public async objectExists(
    bucketName: string,
    objectName: string,
    encryptionKey: string,
  ): Promise<boolean> {
    try {
      const encryptionKeyMd5 = crypto.hash(
        "md5",
        Buffer.from(encryptionKey, "hex"),
      );

      const encryptionKeyBase64 = Buffer.from(encryptionKey, "hex").toString(
        "base64",
      );

      const encryptionKeyMd5Base64 = Buffer.from(
        encryptionKeyMd5,
        "hex",
      ).toString("base64");

      const options: RequestOption = {
        method: "HEAD",
        bucketName,
        objectName,
        headers: {
          "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
          "X-Amz-Server-Side-Encryption-Customer-Key": encryptionKeyBase64,
          "X-Amz-Server-Side-Encryption-Customer-Key-MD5":
            encryptionKeyMd5Base64,
        }
      }
      const req = await Storage.instance.makeRequestAsync(options)
      console.log(req);
      return false;
    } catch (error) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        error,
        "Failed to check object existence",
      );
    }
  }
}

export const storage = new Storage();
