import { videoMetadata, videoTasks, videoEvents, videoTranscripts, videoKeyPoints } from "@src/db/schema/videos";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { eq, sql, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

type Video = typeof videoMetadata.$inferInsert;
type VideoStatus = "pending" | "processing" | "processed" | "failed" | "annotation approved" | "annotation created";
type VideoTranscript = typeof videoTranscripts.$inferInsert;
type VideoKeypoint = typeof videoKeyPoints.$inferInsert;
type VideoTask = typeof videoTasks.$inferInsert;

/**
 * Stores a video event in the database and returns the event ID.
 *
 * @param db - Database connection
 * @param status - Status of the video event
 * @returns String
 *  - ID of the video event
 *
 * @remarks
 * This function will create a new video event in the database.
 */
const storeVideoEvent = async (db: DB, status: VideoStatus) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .insert(videoEvents)
        .values({
          status: status,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ eventId: videoEvents.id });
      return data[0];
    });
    return data.eventId;

  } catch (e: unknown) {
    console.error(`Failed to store video event: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to store video event",
    });
  }
}

/**
 * Stores video metadata in the database and creates a video event.
 *
 * @param db - Database connection
 * @param video - Video metadata to be stored
 * @returns String
 *  - ID of the video metadata
 *
 * @remarks
 * This function will store the video metadata in the database.
 */
const storeVideoMetadata = async (db: DB, video: Video) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx 
        .insert(videoMetadata)
        .values({
          ...video,
        })
        .returning({ id: videoMetadata.id })    

      return data;
    });

    return data[0];
  } catch (e: unknown) {
    console.error(`Failed to store video metadata: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to store video metadata",
    });
  }
}

/**
 * Retrieves a video from the database by its path.
 *
 * @param db - Database connection
 * @param path - Path of the video file
 * @returns 
 *  - Video metadata if found, otherwise undefined
 *
 * @remarks
 * This function will retrieve the video metadata from the database.
 */
const findVideoByPath = async (db: DB, path: string) => {
  const data = await db.select().from(videoMetadata).where(eq(videoMetadata.path, path));
  return data[0];
};

/**
 * Stores a transcript in the database.
 *
 * @param db - Database connection
 * @param transcript - Transcript to be stored
 * @returns String
 *  - ID of the video transcript
 *
 * @remarks
 * This function will store the transcript in the database.
 */
const storeTranscript = async (db: DB, transcript: VideoTranscript) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx 
        .insert(videoTranscripts)
        .values({
          ...transcript,
          createdAt: new Date(),
        })
        .returning({ id: videoTranscripts.id })    

      return data;
    });

    return data[0];
  } catch (e: unknown) {
    console.error(`Failed to store video transcript: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to store video transcript",
    });
  }
}

/**
 * Stores a task in the database.
 *
 * @param db - Database connection
 * @param task - Task to be stored
 * @returns String
 *  - ID of the task
 *
 * @remarks
 * This function will store the task in the database.
 */ 
const storeTask = async (db: DB, task: VideoTask) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx 
        .insert(videoTasks)
        .values({
          ...task,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: videoTasks.id })    

      return data;
    });

    return data[0];
  } catch (e: unknown) {
    console.error(`Failed to store video transcript: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to store video transcript",
    });
  }
}

/**
 * Stores keypoints in the database.
 *
 * @param db - Database connection
 * @param keypoint - Keypoint to be stored
 * @returns String
 *  - ID of the keypoint
 *
 * @remarks
 * This function will store keypoints in the database.
 */
const storeKeypoint = async (db: DB, keypoint: VideoKeypoint) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx 
        .insert(videoKeyPoints)
        .values({
          ...keypoint,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: videoKeyPoints.id })    

      return data;
    });

    return data[0];
  } catch (e: unknown) {
    console.error(`Failed to store keypoint: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to store keypoint",
    });
  }
}

export const videoRepository = {
  storeVideoMetadata,
  storeVideoEvent,
  findVideoByPath,
  storeTranscript,
  storeTask,
  storeKeypoint,
}