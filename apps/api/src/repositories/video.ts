import { status, videoMetadata } from "@src/db/schema/videos"
import { db } from "@src/middleware/db"

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