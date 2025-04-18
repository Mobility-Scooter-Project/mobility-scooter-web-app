import { COMMON_HEADERS } from "@src/config/common-headers";
import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { pub } from "@src/integrations/queue";
import { storage } from "@src/integrations/storage";
import { createObjectEncryptionKey, getObjectEncryptionKey } from "@src/integrations/vault";
import { HTTPException } from "hono/http-exception";
import crypto from "node:crypto";

const putObjectStream = async (
  filePath: string,
  userId: string,
  bucketName: string,
  object: Blob,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data
  try {
    const bucket = await storage.bucketExists(bucketName);
    if (!bucket) {
      await storage.makeBucket(bucketName);
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
      bucketName,
      filePath,
    );

    const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
    const encryptionKeyBase64 = Buffer.from(encryptionKey, 'hex').toString("base64");
    const encryptionKeyMd5Base64 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");
    const expires = 60 * 60 * 24;

    const presignedUrl = await storage.presignedUrl(
      "PUT",
      bucketName,
      filePath,
      expires,
      {
        "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
      }
    );

    const res = await fetch(presignedUrl, {
      method: "PUT",
      body: object,
      headers: {
        "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
        "X-Amz-Server-Side-Encryption-Customer-Key": encryptionKeyBase64,
        "X-Amz-Server-Side-Encryption-Customer-Key-MD5": encryptionKeyMd5Base64,
      },
    });

    if (!res.ok) {
      return;
    }
    
    const data = await generatePresignedGetUrl(
      filePath,
      bucketName,
      userId,
    );

    if (res.ok) {
      await pub.send("videos", {
        videoUrl: data.url,
        filename: filePath,
      });

      return {
        success: true,
      }
    }

  } catch (e) {
    console.error(e);
    throw new HTTPException(HTTP_CODES.INTERNAL_SERVER_ERROR, {
      message: e instanceof Error ? e.message : "Failed to upload object",
      res: new Response(
        JSON.stringify({
          data: null,
          error: "Failed to generate presigned put URL",
        }),
        {
          headers: COMMON_HEADERS.CONTENT_TYPE_JSON,
        }
      ),
    });
  }
};

/**
 * Generates a presigned URL for retrieving a file from the custom storage system.
 *
 * This function creates a URL with specific query parameters, including an expiration time
 * (24 hours from the time of generation) and a cryptographic signature. This URL grants
 * temporary GET access to the specified file associated with a patient and user.
 * The signing process uses HMAC-SHA256 with a predefined secret (`STORAGE_SECRET`).
 *
 * @param filePath - The path to the file within the storage bucket (e.g., 'documents/report.pdf').
 * @param bucketName - The identifier for the storage bucket, typically the patient's ID.
 * @param userId - The identifier of the user requesting the URL.
 * @returns An object containing the generated presigned URL.
 * @example
 * const { url } = await generatePresignedGetUrl('scans/mri_01.dcm', 'patient-123', 'user-456');
 * console.log(url); // Outputs the presigned URL string
 */
const generatePresignedGetUrl = async (
  filePath: string,
  bucketName: string,
  userId: string,
) => {

  const date = new Date();
  const expires = new Date(date.getTime() + 60 * 60 * 24 * 1000);
  const method = "GET";

  const params = new URLSearchParams({
    "X-MSWA-Method": method,
    "X-MSWA-Expires": Math.floor(expires.getTime() / 1000).toString(),
    "X-MSWA-FilePath": filePath,
    "X-MSWA-Bucket": bucketName,
    "X-MSWA-UserId": userId,
  })

  // sign the URL
  const signature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${params.get("X-MSWA-Expires")}\n${filePath}\n${bucketName}\n${userId}`)
    .digest("hex");

  params.append("X-MSWA-Signature", signature);

  const url = `${BASE_URL}/api/v1/storage/presigned-url?${params.toString()}`;
  return { url };
}

const getObjectStream = async (
  bucketName: string,
  filePath: string,
) => {
  const bucket = await storage.bucketExists(bucketName);
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
    bucketName,
    filePath,
  );

  const encryptionKeyMd5 = crypto.hash("md5", Buffer.from(encryptionKey, 'hex'));
  const base64EncryptionKey = Buffer.from(encryptionKey, 'hex').toString("base64");
  const base64EncryptionKeyMd5 = Buffer.from(encryptionKeyMd5, 'hex').toString("base64");

  try {
    const object = await storage.getObject(
      bucketName,
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

/**
 * Validates a presigned URL by checking the signature, expiration date, and bucket existence
 * 
 * @param filePath - The path to the file within the storage bucket
 * @param bucketName - The ID of the patient associated with the bucket
 * @param userId - The ID of the user making the request
 * @param method - The HTTP method to be used (GET, PUT, etc.)
 * @param expires - The expiration timestamp in seconds since epoch
 * @param signature - The signature to validate against
 * 
 * @throws {HTTPException} 
 * - With status UNAUTHORIZED if signature is invalid
 * - With status UNAUTHORIZED if URL has expired
 * - With status NOT_FOUND if patient bucket doesn't exist
 * 
 * @returns {Promise<void>} Resolves if validation is successful
 */
const validatePresignedUrl = async (
  filePath: string,
  bucketName: string,
  userId: string,
  method: string,
  expires: string,
  signature: string,
) => {
  const date = new Date();
  const expiresDate = new Date(parseInt(expires) * 1000);

  const expectedSignature = crypto
    .createHmac("sha256", STORAGE_SECRET)
    .update(`${method}\n${expires}\n${filePath}\n${bucketName}\n${userId}`)
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

  const bucket = await storage.bucketExists(bucketName);
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
  generatePresignedGetUrl,
  getObjectStream,
  putObjectStream,
  validatePresignedUrl,
};