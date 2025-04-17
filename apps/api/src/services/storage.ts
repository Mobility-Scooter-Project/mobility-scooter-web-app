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

    const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
    const encryptionKeyBase64 = Buffer.from(encryptionKey, 'hex').toString("base64");
    const encryptionKeyMd5Base64 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");

    const url = await storage.presignedUrl(
      "PUT",
      patientId,
      uploadPath,
      60 * 60 * 24,
      {
        "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
      }
    );

    return { url, encryptionKey: encryptionKeyBase64, encryptionKeyMd5: encryptionKeyMd5Base64 };
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

  const encryptionKey = await getObjectEncryptionKey(
    patientId,
    uploadPath,
  );

  const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
  const base64EncryptionKey = Buffer.from(encryptionKey, 'hex').toString("base64");
  const base64EncryptionKeyMd5 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");

  const object = await storage.getObject(
    patientId,
    uploadPath,
    {
      SSECustomerAlgorithm: "AES256",
      SSECustomerKey: base64EncryptionKey,
      SSECustomerKeyMD5: base64EncryptionKeyMd5,
    }
  )

  return {
    stream: object
  }
}

export const storageService = {
  generatePresignedVideoPutUrl,
  generatePresignedVideoGetUrl
};