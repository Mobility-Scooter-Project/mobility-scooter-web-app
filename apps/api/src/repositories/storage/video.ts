import { fileMetadata, tasks, events, keyPoints } from "@src/db/schema/storage";
import { postgresDB, type DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

type Video = typeof fileMetadata.$inferInsert;
type VideoStatus = "pending" | "processing" | "processed" | "failed" | "annotation approved" | "annotation created";
type keyPoint = typeof keyPoints.$inferInsert;
type task = typeof tasks.$inferInsert;

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
        .insert(events)
        .values({
          status: status,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ eventId: events.id });
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
 * @param video - Video metadata to be stored
 * @returns String
 *  - ID of the video metadata
 *
 * @remarks
 * This function will store the video metadata in the database.
 */
const createVideoMetadata = async (video: Omit<Video, "statusEventId">) => {
  try {
    const data = await postgresDB.transaction(async (tx) => {
      const eventData = await tx.insert(events)
        .values({
          status: "pending",
        }).returning({ eventId: events.id });

      return await tx
        .insert(fileMetadata)
        .values({
          ...video,
          statusEventId: eventData[0].eventId,
        }).returning({ id: fileMetadata.id });
    })

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
const findVideo = async (db: DB, pathOrId: string, videoIdentifier: string) => {
  if (pathOrId === "id") {
    const data = await db.select().from(fileMetadata).where(eq(fileMetadata.id, videoIdentifier));
    return data[0];
  } else if (pathOrId === "path") {
    const data = await db.select().from(fileMetadata).where(eq(fileMetadata.path, videoIdentifier));
    return data[0];
  }
};


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
const storeTask = async (db: DB, task: task) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .insert(tasks)
        .values({
          ...task,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: tasks.id })

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
const storeKeypoint = async (db: DB, keypoint: keyPoint) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .insert(keyPoints)
        .values({
          ...keypoint,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: keyPoints.id })

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

/**
 * Updates the status of a video event in the database.
 *
 * @param db - Database connection
 * @param eventId - ID of the video event to be updated
 * @param status - New status of the video event
 * @returns String
 *  - ID of the updated video event
 *
 * @remarks
 * This function will update the status of the video event in the database.
 */
const updateVideoEvent = async (db: DB, eventId: string, status: VideoStatus) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .update(events)
        .set({
          status: status,
          updatedAt: new Date(),
        })
        .where(
          eq(events.id, eventId),
        )
        .returning({ id: events.id });

      return data[0];
    });
    return data.id;
  } catch (e: unknown) {
    console.error(`Failed to update video event: ${e}`);
    throw new HTTPException(HTTP_CODES.NOT_IMPLEMENTED, {
      message: "Failed to update video event",
    });
  }
}

export const videoRepository = {
  createVideoMetadata,
  storeVideoEvent,
  findVideo,
  storeTranscript,
  storeTask,
  storeKeypoint,
  updateVideoEvent
}