import { HTTP_CODES } from "@src/config/http-codes";
import { storage } from "@src/integrations/storage";
import { createObjectEncryptionIv, createObjectEncryptionKey, getObjectEncryptionIv, getObjectEncryptionKey, vault } from "@src/integrations/vault";
import { HTTPException } from "hono/http-exception";
import crypto from "node:crypto";

const generatePresignedVideoPutUrl = async (
  filename: string,
  userId: string,
  patientId: string,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data
  try {
    const bucket = await storage.bucketExists(patientId);
    if (!bucket) {
      await storage.makeBucket(patientId);
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
    const uploadPath = `videos/${filename}`;

    const encryptionKey = await createObjectEncryptionKey(
      patientId,
      uploadPath,
    );


    const url = await storage.presignedPutObject(
      patientId,
      uploadPath,
      60 * 60 * 24,
    );

    return { url, encryptionKey };
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned URL",
        }),
      ),
    });
  }
};

const generatePresignedVideoGetUrl = async (
  filename: string,
  userId: string,
  patientId: string,
) => {
  const bucket = await storage.bucketExists(patientId);
  if (!bucket) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Bucket not found",
        }),
      ),
    });
  }

  const uploadPath = `videos/${filename}`;
  const url = await storage.presignedGetObject(
    patientId,
    uploadPath,
    60 * 60 * 24,
  );

  const encryptionKey = await getObjectEncryptionKey(
    patientId,
    uploadPath,
  );

  const encryptionIv = await getObjectEncryptionIv(
    patientId,
    uploadPath,
  );

  if (!encryptionKey || !encryptionIv) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Encryption key not found",
        }),
      ),
    });
  }


  if (!url) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "File not found",
        }),
      ),
    });
  }

  return { url, encryptionKey, encryptionIv };
}

export const storageService = {
  generatePresignedVideoPutUrl,
  generatePresignedVideoGetUrl
};