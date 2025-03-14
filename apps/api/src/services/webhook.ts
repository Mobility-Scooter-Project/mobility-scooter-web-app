import { pub } from "@src/integrations/queue";
import { videoRepository } from "@src/repositories/video";
import { UploadVideoPayload } from "@src/types/webhooks";


/**
 * Processes an S3/Minio upload webhook event for a video file.
 * Creates video metadata and publishes a message for video processing.
 * 
 * @param payload - The S3 event payload containing information about the uploaded video
 * 
 * @throws Will throw an error if video metadata creation or message publishing fails
 */
const putVideo = async (payload: UploadVideoPayload) => {
    // TODO: validate the payload
    const filename = payload.Records[0].s3.object.key;
    const patientId = payload.Records[0].s3.bucket.name;

    await videoRepository.createVideoMetadata(filename, patientId);
    await pub.send("video-processing", { filename, patientId });
}

export const webhookService = { putVideo }