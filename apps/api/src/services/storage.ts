import { ENVIRONMENT } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { storage } from "@src/integrations/storage";
import { HTTPException } from "hono/http-exception";

/**
 * Generates a pre-signed put url and creates a bucket to upload and store a video
 *
 * @param filename - Name of a video file
 * @param patientId - ID associated with a patient
 * @param userId - ID associated with a user
 * @param date - Date of a video
 * @returns String:
 *  - Pre-signed url used to upload a video to the object store
 *
 * @remarks
 * This function will check if a bucket exists with a patient's ID. 
 * If it does not exist, it will create a bucket before generating the pre-signed url.
 *
 * @throws {HTTPException} With status 500 if the storage cannot create a bucket or pre-signed url
 */
const generatePresignedVideoPutUrl = async (
  filename: string,
  patientId: string,
  userId: string,
  date: Date,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data
  try {
    const bucket = await storage.bucketExists(patientId);
    if (!bucket) {
      await storage.makeBucket(patientId);
      if (ENVIRONMENT === "production") {
        await storage.setBucketEncryption(patientId); // defaults to {Rule:[{ApplyServerSideEncryptionByDefault:{SSEAlgorithm:"AES256"}}]}
      }
    }
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to create or retrieve bucket",
        }),
      ),
    });
  }
  try {
    return await storage.presignedPutObject(
      patientId,
      `videos/${date}/${filename}`,
      60 * 60 * 24,
    );
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned put URL",
        }),
      ),
    });
  }
};

/**
 * Generates a pre-signed get url to retrieve a video from the object store
 *
 * @param filename - Name of a video file
 * @param patientId - ID associated with a patient
 * @param userId - ID associated with a user
 * @param date - Date of a video
 * @returns String:
 *  - Pre-signed url used to retrieve a video from the object store
 *
 * @remarks
 * This function will check if the provided video data exists in the object store. 
 * If it does exist, it will generate a pre-signed url.
 *
 * @throws {HTTPException} With status 500 if the storage cannot create a pre-signed url
 * @throws {HTTPException} With status 404 if the storage cannot find a video with the provided data
 */
const generatePresignedVideoGetUrl = async (
  filename: string,
  patientId: string,
  userId: string,
  date: Date
) => {
  try {
    await storage.statObject(patientId, `videos/${date}/${filename}`);
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Video not found with the provided data",
        }),
      ),
    });
  }
  try {
    return await storage.presignedGetObject(
      patientId,
      `videos/${date}/${filename}`,
      60 * 60 * 24,
    );
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned get URL",
        }),
      ),
    });
  }
}

export const storageService = {
  generatePresignedVideoPutUrl,
  generatePresignedVideoGetUrl,
};
