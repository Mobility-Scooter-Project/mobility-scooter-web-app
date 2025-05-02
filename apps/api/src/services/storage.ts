import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { FILE_TYPES } from "@src/config/file-types";
import { TOPICS } from "../../../../packages/shared/src/config/queue";
import { queue } from "@src/integrations/queue";
import { storage } from "@src/integrations/storage";
import { vault } from "@src/integrations/vault";
import { videoRepository } from "@src/repositories/storage/video";
import crypto from "node:crypto";
import { Stream } from "nodemailer/lib/xoauth2";

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
 * @param userId - The identifier of the user uploading the object.
 * @param bucketName - The name of the bucket where the object will be stored.
 * @param object - The Blob object to be uploaded.
 * @param uploadedAt - The date when the object was uploaded.
 * @param fileType - The type of the file being uploaded (e.g., video, transcript).
 *
 * @returns A promise that resolves once the object has been uploaded and the queue message has been published.
 */
const putObjectStream = async (
  filePath: string,
  userId: string,
  bucketName: string,
  uploadStream: ReadableStream<any>,
  uploadedAt: Date,
  fileType = FILE_TYPES.VIDEO,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data

  const expires = 60 * 60 * 24;

  await storage.getOrCreateBucket(bucketName);

  const encryptionKey = await vault.createObjectEncryptionKey(
    bucketName,
    filePath,
  );

  await storage.multipartUpload(
    uploadStream,
    bucketName,
    filePath,
    encryptionKey,
  );
  /*
    if (fileType == FILE_TYPES.VIDEO) {
      const transcriptPath = filePath.replace(/\.mp4$/, ".vtt");
      const videoDataPromise = generatePresignedGetUrl(
        filePath,
        bucketName,
        userId,
      );
  
      const transcriptPutUrlPromise = storage.presignedUrl(
        "PUT",
        bucketName,
        transcriptPath,
        expires,
  
      );
  
      const videoMetadataPromise = createVideoMetadata(
        bucketName,
        filePath,
        uploadedAt,
      );
  
      const [videoData, transcriptPutUrl, videoMetadata] = await Promise.all([
        videoDataPromise,
        transcriptPutUrlPromise,
        videoMetadataPromise,
      ]);
  
      await queue.publish(
        TOPICS.VIDEOS,
        {
          data: {
            id: videoMetadata.id,
            url: videoData.url,
            filename: filePath,
            transcriptPutUrl,
          }
        })
    }*/
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
  })

  // sign the URL
  const signature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${params.get("X-MSWA-Expires")}\n${filePath}\n${bucketName}`)
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
 * @param method - The HTTP method for the pre-signed URL
 * @param expires - The expiration timestamp of the pre-signed URL
 * @param signature - The signature of the pre-signed URL for validation
 * @throws {Error} If the pre-signed URL validation fails
 * @returns {Promise<void>}
 */
const validatePresignedUrl = async (
  filePath: string,
  bucketName: string,
  method: string,
  expires: string,
  signature: string,
) => {
  await storage.validatePresignedUrl(
    filePath,
    bucketName,
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
const createVideoMetadata = async (
  patientId: string,
  path: string,
  uploadedAt: Date,
) => {

  return await videoRepository.createVideoMetadata({
    patientId,
    path,
    uploadedAt
  });
}

export const storageService = {
  generatePresignedGetUrl,
  getObjectStream,
  putObjectStream,
  validatePresignedUrl,
  createVideoMetadata,
};