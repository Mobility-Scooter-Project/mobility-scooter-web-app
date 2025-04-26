import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { TOPICS } from "@src/config/topic";
import { queue } from "@src/integrations/queue";
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

  await queue.publish(
    TOPICS.VIDEOS,
    {
      videoUrl: data.url,
      filename: filePath,
    });
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

/**
 * Stores video metadata in the database and creates a video event
 *
 * @param db - Database connection
 * @param patientId - ID associated with a patient
 * @param path - Path of the video file
 * @param date - Date of the video
 * @returns String
 *  - ID of the video metadata
 *
 * @remarks
 * This function will create an event ID and store the video metadata in the database.
 * The event ID is used to track the status of the video.
 */
const storeVideoMetadata = async (
  db: DB,
  patientId: string,
  path: string,
  date: Date,
) => {

  const eventId = await videoRepository.storeVideoEvent(db, "pending")
  
  return videoRepository.storeVideoMetadata(db, {
    patientId,
    eventId,
    path,
    date
  });
}

/**
 * Stores a transcript in the database
 *
 * @param db - Database connection
 * @param videoId - ID of the video
 * @param transcriptPath - Path of the transcript file
 * @returns String
 *  - ID of the transcript
 *
 * @remarks
 * This function will store the transcript in the database.
 */
const storeTranscript = async (
  db: DB, 
  videoId: string, 
  transcriptPath: string) => {
  
  return videoRepository.storeTranscript(db, {
    videoId, 
    path: transcriptPath,
  });
}

/**
 * Stores a task in the database
 *
 * @param db - Database connection
 * @param videoId - ID of the video
 * @param taskId - ID of the task in relations to other tasks in the video
 * @param task - Task object containing task details
 * @returns String
 *  - ID of the task
 *
 * @remarks
 * This function will store the task in the database.
 */
const storeTask = async (
  db: DB, 
  videoId: string,
  taskId: number, 
  task: {
    task: string;
    start: string;
    end: string;
  }) => {

  return videoRepository.storeTask(db, {
    videoId, 
    taskId, 
    task,
  });
}

/**
 * Stores keypoints in the database
 *
 * @param db - Database connection
 * @param videoId - ID of the video
 * @param timestamp - Timestamp of a frame in the video
 * @param angle - Angle of the trunk flexion
 * @param keypoints - Keypoints object containing keypoint details
 * @returns String
 *  - ID of the keypoint
 *
 * @remarks
 * This function will store keypoints in the database.
 */
const storeKeypoint = async (
  db: DB, 
  videoId: string, 
  timestamp: string,
  angle: number, 
  keypoints: {
    [name: string]: [number, number];
  } 
) => {

  return videoRepository.storeKeypoint(db, {
    videoId,
    timestamp,
    angle,
    keypoints,
  });
}

/**
 * Finds a video ID in the database by a video path
 *
 * @param db - Database connection
 * @param videoPath - Path of the video file
 * @returns String
 *  - ID of the video
 *
 * @remarks
 * This function will find a video ID in the database by its path.
 */
const findVideo = async (
  db: DB,
  pathOrId: string,
  videoIdentifier: string,
) => {
  const video = await videoRepository.findVideo(db, pathOrId, videoIdentifier);

  if (!video) {
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid video path" }),
      ),
    });
  }

  return video;
}

/**
 * Updates the status of a video event in the database
 *
 * @param db - Database connection
 * @param eventId - ID of the video event
 * @param status - Status of the video event
 * @returns String
 *  - ID of the updated video event
 *
 * @remarks
 * This function will update the status of a video event in the database.
 */
const updateVideoEvent = async (
  db: DB,
  eventId: string,
  status: VideoStatus,
) => {
  
  return videoRepository.updateVideoEvent(db, eventId, status);
}

export const storageService = {
  generatePresignedGetUrl,
  getObjectStream,
  putObjectStream,
  validatePresignedUrl,
};