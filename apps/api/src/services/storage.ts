import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { TOPICS } from "@src/config/topic";
import { pub } from "@src/integrations/queue";
import { storage } from "@src/integrations/storage";
import { vault } from "@src/integrations/vault";
import crypto from "node:crypto";


const putObjectStream = async (
  filePath: string,
  userId: string,
  bucketName: string,
  object: Blob,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data

  const expires = 60 * 60 * 24;

  await storage.getOrCreateBucket(bucketName);

  const presignedUrlPromise = storage.presignedUrl(
    "PUT",
    bucketName,
    filePath,
    expires,
    {
      "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
    }
  );

  const encryptionKeyPromise = vault.createObjectEncryptionKey(
    bucketName,
    filePath,
  );

  const [encryptionKey, presignedUrl] = await Promise.all([
    encryptionKeyPromise,
    presignedUrlPromise,
  ]);

  await storage.uploadToPresignedUrl(
    presignedUrl,
    object,
    encryptionKey,
  );

  // TODO: @tdang2180 - add your metadata upload here

  const data = await generatePresignedGetUrl(
    filePath,
    bucketName,
    userId,
  );

  await pub.send(TOPICS.VIDEOS, {
    videoUrl: data.url,
    filename: filePath,
  })
};


/**
 * Generates a pre-signed URL for GET operations on stored files
 * 
 * @param filePath - The path to the file in storage
 * @param bucketName - The name of the storage bucket
 * @param userId - The ID of the user requesting access
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
 * - X-MSWA-UserId: The provided user ID
 * - X-MSWA-Signature: HMAC-SHA256 signature of the request parameters
 */
const generatePresignedGetUrl = async (
  filePath: string,
  bucketName: string,
  userId: string,
) => {

  const date = new Date();
  const expires = new Date(date.getTime() + 60 * 60 * 24 * 1000);
  const method = "GET";

  const params = new URLSearchParams({
    "X-MSWA-Method": method,
    "X-MSWA-Expires": Math.floor(expires.getTime() / 1000).toString(),
    "X-MSWA-FilePath": filePath,
    "X-MSWA-Bucket": bucketName,
    "X-MSWA-UserId": userId,
  })

  // sign the URL
  const signature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${params.get("X-MSWA-Expires")}\n${filePath}\n${bucketName}\n${userId}`)
    .digest("hex");

  params.append("X-MSWA-Signature", signature);

  const url = `${BASE_URL}/api/v1/storage/presigned-url?${params.toString()}`;
  return { url };
}


/**
 * Retrieves an object stream from storage with encryption.
 * 
 * @param bucketName - The name of the bucket to retrieve the object from
 * @param filePath - The file path of the object within the bucket
 * @returns A promise that resolves to an object containing the stream
 * @throws {Error} If the bucket does not exist or if there's an issue retrieving the encryption key
 */
const getObjectStream = async (
  bucketName: string,
  filePath: string,
) => {
  const bucketExistsPromise = storage.bucketExists(bucketName);
  const encryptionKeyPromise = vault.getObjectEncryptionKey(
    bucketName,
    filePath,
  );

  const [_, encryptionKey] = await Promise.all([
    bucketExistsPromise,
    encryptionKeyPromise,
  ]);

  const object = await storage.getObject(
    bucketName,
    filePath,
    encryptionKey
  )

  return {
    stream: object
  }
}


/**
 * Validates a pre-signed URL for storage operations
 * @param filePath - The path to the file in storage
 * @param bucketName - The name of the storage bucket
 * @param userId - The ID of the user making the request
 * @param method - The HTTP method for the pre-signed URL
 * @param expires - The expiration timestamp of the pre-signed URL
 * @param signature - The signature of the pre-signed URL for validation
 * @throws {Error} If the pre-signed URL validation fails
 * @returns {Promise<void>}
 */
const validatePresignedUrl = async (
  filePath: string,
  bucketName: string,
  userId: string,
  method: string,
  expires: string,
  signature: string,
) => {
  await storage.validatePresignedUrl(
    filePath,
    bucketName,
    userId,
    method,
    expires,
    signature,
  );
}

export const storageService = {
  generatePresignedGetUrl,
  getObjectStream,
  putObjectStream,
  validatePresignedUrl,
};