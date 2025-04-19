import { COMMON_HEADERS } from "@src/config/common-headers";
import {
  ENVIRONMENT,
  STORAGE_ACCESS_KEY,
  STORAGE_PORT,
  STORAGE_SECRET,
  STORAGE_SECRET_KEY,
  STORAGE_URL,
} from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPException } from "hono/http-exception";
import { Client } from "minio";
import crypto from "node:crypto";

export class Storage {
  private static instance: Client;
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
      } catch (error) {
        console.error("Failed to connect to MinIO:", error);
      }
    }
  }

  /**
   * Checks if a bucket exists in the storage system.
   * @param bucketName - The name of the bucket to check
   */
  public async bucketExists(bucketName: string) {
    try {
      const bucketExists = await Storage.instance.bucketExists(bucketName);
      if (!bucketExists) {
        throw new HTTPException(HTTP_CODES.NOT_FOUND, {
          res: new Response(
            JSON.stringify({
              data: null,
              error: "Bucket does not exist",
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
        });
      }
    } catch (error) {
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Failed to check bucket existence",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      });
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
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Failed to create bucket",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      });
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
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Failed to get object",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      });
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
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Failed to get presigned URL",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      });
    }
  }

  public async uploadToPresignedUrl(
    url: string,
    object: Blob,
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

      await fetch(url, {
        method: "PUT",
        body: object,
        headers: {
          "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
          "X-Amz-Server-Side-Encryption-Customer-Key": encryptionKeyBase64,
          "X-Amz-Server-Side-Encryption-Customer-Key-MD5":
            encryptionKeyMd5Base64,
        },
      });
    } catch (error) {
      throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Failed to upload to presigned URL",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      });
    }
  }

  /**
   * Validates a presigned URL by checking its signature, expiration, and bucket existence
   * 
   * @param filePath - The path to the file in the storage bucket
   * @param bucketName - The name of the storage bucket
   * @param userId - The ID of the user requesting access
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
    userId: string,
    method: string,
    expires: string,
    signature: string,
  ) {
    const date = new Date();
    const expiresDate = new Date(parseInt(expires) * 1000);

    const expectedSignature = crypto
      .createHmac("sha256", STORAGE_SECRET)
      .update(`${method}\n${expires}\n${filePath}\n${bucketName}\n${userId}`)
      .digest("hex");
    if (signature !== expectedSignature) {
      throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Invalid signature",
          }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }

    if (expiresDate < date) {
      throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
        res: new Response(
          JSON.stringify({
            data: null,
            error: "Presigned URL expired",
          }),
          { headers: COMMON_HEADERS.CONTENT_TYPE_JSON },
        ),
      });
    }

    await storage.bucketExists(bucketName);
  }
}

export const storage = new Storage();
