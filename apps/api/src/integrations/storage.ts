import {
  ENVIRONMENT,
  STORAGE_ACCESS_KEY,
  STORAGE_PORT,
  STORAGE_SECRET_KEY,
  STORAGE_URL,
} from "@src/config/constants";
import { Client } from "minio";

export const storage = new Client({
  endPoint: STORAGE_URL,
  port: Number(STORAGE_PORT),
  useSSL: true,
  accessKey: STORAGE_ACCESS_KEY,
  secretKey: STORAGE_SECRET_KEY,
});

// enable self-signed certificate for local development
if (ENVIRONMENT !== "production") {
  storage.setRequestOptions({
    rejectUnauthorized: false
  })
}