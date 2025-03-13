import { storage } from "@src/lib/storage"
import { HTTPException } from "hono/http-exception";

const generatePresignedVideoUrl = async (filename: string, userId: string, patientId: string, date: Date) => {
    // TODO: check if user has permission to upload video -> relies on proper patient schema
    try {
        const bucket = await storage.bucketExists(patientId);
        if (!bucket) {
            await storage.makeBucket(patientId);
            // TODO: set bucket policy
        }
    } catch (e) {
        console.error(e);
        throw new HTTPException(500, {
            res: new Response(JSON.stringify({
                data: null,
                error: "Failed to create or retrieve bucket"
            }))
        });
    }
    try {
    return await storage.presignedPutObject(patientId, `videos/${filename}`, 60 * 60 * 24);
    } catch (e) {
        console.error(e);
        throw new HTTPException(500, {
            res: new Response(JSON.stringify({
                data: null,
                error: "Failed to generate presigned URL"
            }))
        });
    }
}

export const storageService = {
    generatePresignedVideoUrl
}