import { storage } from "@src/integrations/storage"
import { HTTPException } from "hono/http-exception";

const generatePresignedVideoUrl = async (filename: string, patientId: string, date: Date) => {
    try {
        const bucket = await storage.bucketExists(patientId);
        if (!bucket) {
            await storage.makeBucket(patientId);
            
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
        return await storage.presignedPutObject(patientId, `videos/${patientId}/${date}/${filename}`, 60 * 60 * 24);
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