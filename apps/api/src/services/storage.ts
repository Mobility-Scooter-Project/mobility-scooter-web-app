import { storage } from "@src/integrations/storage"
import { HTTPException } from "hono/http-exception";

const generatePresignedVideoPutUrl = async (filename: string, patientId: string, userId: string, date: Date) => {
    // TODO: check if user has access to patientId

    // each patient gets their own bucket to attempt to isolate their data
    try {
        const bucket = await storage.bucketExists(patientId);
        if (!bucket) {
            await storage.makeBucket(patientId);
            await storage.setBucketEncryption(patientId); // defaults to {Rule:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:"AES256"}}]}
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
        return await storage.presignedPutObject(patientId, `videos/${date}/${filename}`, 60 * 60 * 24);
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
    generatePresignedVideoPutUrl
}