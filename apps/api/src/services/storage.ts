import { COMMON_HEADERS } from "@src/config/common-headers";
import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { storage } from "@src/integrations/storage";
import { createObjectEncryptionKey, getObjectEncryptionKey } from "@src/integrations/vault";
import { HTTPException } from "hono/http-exception";
import crypto from "node:crypto";

const generatePresignedVideoPutUrl = async (
  filePath: string,
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
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON }
      ),
    });
  }
  try {
    const encryptionKey = await createObjectEncryptionKey(
      patientId,
      filePath,
    );

    const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
    const encryptionKeyBase64 = Buffer.from(encryptionKey, 'hex').toString("base64");
    const encryptionKeyMd5Base64 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");

    const url = await storage.presignedUrl(
      "PUT",
      patientId,
      filePath,
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
        {
          headers: COMMON_HEADERS.CONTENT_TYPE_JSON,
        }
      ),
    });
  }
};

const generatePresignedGetUrl = async (
  filePath: string,
  patientId: string,
  userId: string,
) => {

  const date = new Date();
  const expires = new Date(date.getTime() + 60 * 60 * 24 * 1000);
  const method = "GET";

  const params = new URLSearchParams({
    "X-MSWA-Method": method,
    "X-MSWA-Expires": Math.floor(expires.getTime() / 1000).toString(),
    "X-MSWA-FilePath": filePath,
    "X-MSWA-Bucket": patientId,
    "X-MSWA-UserId": userId,
  })

  // sign the URL
  const signature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${params.get("X-MSWA-Expires")}\n${filePath}\n${patientId}\n${userId}`)
    .digest("hex");

  params.append("X-MSWA-Signature", signature);

  const url = `${BASE_URL}/api/v1/storage/presigned-url?${params.toString()}`;
  return { url };
}

const getObjectStream = async (
  filePath: string,
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
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON }
      ),
    });
  }

  const encryptionKey = await getObjectEncryptionKey(
    patientId,
    filePath,
  );

  const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
  const base64EncryptionKey = Buffer.from(encryptionKey, 'hex').toString("base64");
  const base64EncryptionKeyMd5 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");

  try {
    const object = await storage.getObject(
      patientId,
      filePath,
      {
        SSECustomerAlgorithm: "AES256",
        SSECustomerKey: base64EncryptionKey,
        SSECustomerKeyMD5: base64EncryptionKeyMd5,
      }
    )

    return {
      stream: object
    }
  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to retrieve object",
        }),
        {
          headers: COMMON_HEADERS.CONTENT_TYPE_JSON,
        }
      ),
    });
  }
}

const validatePresignedUrl = async (
  filename: string,
  patientId: string,
  userId: string,
  method: string,
  expires: string,
  signature: string,
) => {
  const date = new Date();
  const expiresDate = new Date(parseInt(expires) * 1000);

  const expectedSignature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${expires}\n${filename}\n${patientId}\n${userId}`)
    .digest("hex");
  if (signature !== expectedSignature) {
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Invalid signature",
        }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON }
      ),
    });
  }

  if (expiresDate < date) {
    throw new HTTPException(HTTP_CODES.UNAUTHORIZED, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Presigned URL expired",
        }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON }
      ),
    });
  }

  const bucket = await storage.bucketExists(patientId);
  if (!bucket) {
    throw new HTTPException(HTTP_CODES.NOT_FOUND, {
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Bucket not found",
        }),
        { headers: COMMON_HEADERS.CONTENT_TYPE_JSON }
      ),
    });
  }

}

export const storageService = {
  generatePresignedVideoPutUrl,
  generatePresignedGetUrl,
  getObjectStream,
  validatePresignedUrl,
};