import { ENVIRONMENT } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { storage } from "@src/integrations/storage";
import { HTTPException } from "hono/http-exception";
import type { DB } from "@middleware/db";
import { videoRepository  } from "@src/repositories/video";

/**
 * Generates a pre-signed put url and creates a bucket to upload and store a video
 *
 * @param filename - Name of a video file
 * @param patientId - ID associated with a patient
 * @param userId - ID associated with a user
 * @param date - Date of a video
 * @returns String:
 *  - Pre-signed url used to upload a video to the object store
 *
 * @remarks
 * This function will check if a bucket exists with a patient's ID. 
 * If it does not exist, it will create a bucket before generating the pre-signed url.
 *
 * @throws {HTTPException} With status 500 if the storage cannot create a bucket or pre-signed url
 */
const generatePresignedPutUrl = async (
  filename: string,
  patientId: string,
  content: string,
  userId: string,
  date: Date,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data
  try {
    const bucket = await storage.bucketExists(patientId);
    if (!bucket) {
      await storage.makeBucket(patientId);
      if (ENVIRONMENT === "production") {
        await storage.setBucketEncryption(patientId); // defaults to {Rule:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:"AES256"}}]}
      }
    }
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to create or retrieve bucket",
        }),
      ),
    });
  }
  try {
    return await storage.presignedPutObject(
      patientId,
      `${date}/${content}s/${filename}`,
      60 * 60 * 24,
    );
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned put URL",
        }),
      ),
    });
  }
};

/**
 * Generates a pre-signed get url to retrieve a video from the object store
 *
 * @param filename - Name of a video file
 * @param patientId - ID associated with a patient
 * @param userId - ID associated with a user
 * @param date - Date of a video
 * @returns String:
 *  - Pre-signed url used to retrieve a video from the object store
 *
 * @remarks
 * This function will check if the provided video data exists in the object store. 
 * If it does exist, it will generate a pre-signed url.
 *
 * @throws {HTTPException} With status 500 if the storage cannot create a pre-signed url
 * @throws {HTTPException} With status 404 if the storage cannot find a video with the provided data
 */
const generatePresignedGetUrl = async (
  filename: string,
  patientId: string,
  content: string,
  userId: string,
  date: Date,
) => {
  try {
    await storage.statObject(patientId, `${date}/${content}s/${filename}`);
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: `${content} not found with the provided data`,
        }),
      ),
    });
  }
  try {
    return await storage.presignedGetObject(
      patientId,
      `${date}/${content}s/${filename}`,
      60 * 60 * 24,
    );
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned get URL",
        }),
      ),
    });
  }
}

const storeVideoMetadata = async (
  db: DB,
  patientId: string,
  path: string,
  date: Date,
) => {

  const eventId = await videoRepository.storeVideoEvent(db, "pending")
  
  await videoRepository.storeVideoMetadata(db, {
    patientId,
    eventId,
    path,
    date
  });
}

const storeTranscript = async (db: DB, videoId: string, transcriptPath: string) => {
  return videoRepository.storeTranscript(db, videoId, transcriptPath);
}

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

const findVideoId = async (
  db: DB,
  videoPath: string,
) => {
  const video = await videoRepository.findVideoByPath(db, videoPath);

  if (!video) {
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      res: new Response(
        JSON.stringify({ data: null, error: "Invalid video path" }),
      ),
    });
  }

  return video.id;
}
 
export const storageService = {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  storeVideoMetadata,
  storeTranscript,
  storeTask,
  storeKeypoint,
  findVideoId,
};
