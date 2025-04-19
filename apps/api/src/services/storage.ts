import { BASE_URL, STORAGE_SECRET } from "@src/config/constants";
import { storage } from "@src/integrations/storage";
import { vault } from "@src/integrations/vault";
import crypto from "node:crypto";

/**
 * Uploads an object to a specified bucket with server-side encryption and generates a presigned URL for retrieval.
 * 
 * @param filePath - The path where the file will be stored in the bucket
 * @param userId - The ID of the user uploading the file
 * @param bucketName - The name of the bucket where the file will be stored
 * @param object - The Blob object to be uploaded
 * 
 * @throws {HTTPException} When bucket creation/retrieval fails
 * @throws {HTTPException} When upload or presigned URL generation fails
 * 
 * @returns {Promise<{ success: boolean } | undefined>} Returns an object indicating success, or undefined if upload fails
 * 
 * @remarks
 * - Creates a bucket if it doesn't exist
 * - Implements server-side encryption using AES256
 * - Generates a presigned URL for PUT operation
 * - Publishes video information to "videos" channel upon successful upload
 */
const putObjectStream = async (
  filePath: string,
  userId: string,
  bucketName: string,
  object: Blob,
) => {
  // TODO: check if user has access to patientId

  // each patient gets their own bucket to attempt to isolate their data

  const expires = 60 * 60 * 24;

  await storage.getOrCreateBucket(bucketName);

  const presignedUrlPromise = storage.presignedUrl(
    "PUT",
    bucketName,
    filePath,
    expires,
    {
      "X-Amz-Server-Side-Encryption-Customer-Algorithm": "AES256",
    }
  );

  const encryptionKeyPromise = vault.createObjectEncryptionKey(
    bucketName,
    filePath,
  );

  const [encryptionKey, presignedUrl] = await Promise.all([
    encryptionKeyPromise,
    presignedUrlPromise,
  ]);

  await storage.uploadToPresignedUrl(
    presignedUrl,
    object,
    encryptionKey,
  );


  const data = await generatePresignedGetUrl(
    filePath,
    bucketName,
    userId,
  );
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

/**
 * Retrieves an encrypted object stream from a specified bucket.
 * 
 * @param bucketName - The name of the bucket to retrieve the object from
 * @param filePath - The path to the file within the bucket
 * 
 * @throws {HTTPException} With status NOT_FOUND if bucket doesn't exist
 * @throws {HTTPException} With status INTERNAL_SERVER_ERROR if object retrieval fails
 * 
 * @returns {Promise<{stream: Object}>} A promise that resolves to an object containing the file stream
 */
const getObjectStream = async (
  bucketName: string,
  filePath: string,
) => {
  const bucketExistsPromise = storage.bucketExists(bucketName);
  const encryptionKeyPromise = vault.getObjectEncryptionKey(
    bucketName,
    filePath,
  );

  const [_, encryptionKey] = await Promise.all([
    bucketExistsPromise,
    encryptionKeyPromise,
  ]);

  const object = await storage.getObject(
    bucketName,
    filePath,
    encryptionKey
  )

  return {
    stream: object
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
  await storage.validatePresignedUrl(
    filePath,
    bucketName,
    userId,
    method,
    expires,
    signature,
  );
}

export const storageService = {
  generatePresignedGetUrl,
  getObjectStream,
  putObjectStream,
  validatePresignedUrl,
};