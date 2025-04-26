import { fileMetadata, tasks, events, keyPoints } from "@shared/db/schema/storage";
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


export const videoRepository = {
  createVideoMetadata,
  storeVideoEvent,
}