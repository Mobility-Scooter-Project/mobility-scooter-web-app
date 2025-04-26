import { videoMetadata, videoTasks, videoEvents, videoTranscripts, videoKeyPoints } from "@src/db/schema/videos";
import type { DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { eq, sql, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

type Video = typeof videoMetadata.$inferInsert;
type VideoStatus = "pending" | "processing" | "processed" | "failed" | "annotation approved" | "annotation created";
type VideoKeypoint = typeof videoKeyPoints.$inferInsert;
type VideoTask = typeof videoTasks.$inferInsert;

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

const findVideoByPath = async (db: DB, path: string) => {
  const data = await db.select().from(videoMetadata).where(eq(videoMetadata.path, path));
  return data[0];
};

const storeTranscript = async (db: DB, videoId: string, transcriptPath: string) => {
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx 
        .insert(videoTranscripts)
        .values({
          videoId: videoId,
          path: transcriptPath,
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