import { status, videoMetadata } from "@src/db/schema/videos"
import { db } from "@src/middleware/db"

/**
 * Creates video metadata and its initial status entry in the database
 * @param filename - The name of the video file
 * @param patientId - The ID of the patient associated with the video
 * @returns A Promise that resolves when the database transaction is complete
 * @throws Will throw an error if the database transaction fails
 */
const createVideoMetadata = async (filename: string, patientId: string) => {
    // uses the postgres role since this is from a webhook
    await db.transaction(async (tx) => {
        const data = await tx.insert(videoMetadata).values({
            filename,
            patientId,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning({ id: videoMetadata.id });

        await tx.insert(status).values({
            video_id: data[0].id,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        });
    })
}

export const videoRepository = {
    createVideoMetadata
}