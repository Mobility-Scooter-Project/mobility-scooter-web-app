import {
  ENVIRONMENT,
  STORAGE_ACCESS_KEY,
  STORAGE_PORT,
  STORAGE_SECRET_KEY,
  STORAGE_URL,
} from "@src/config/constants";
import { Client } from "minio";

export class Storage {
  private static instance: Client;
  private constructor() { }
  /**
   * Returns a singleton instance of the Client class.
   * @returns {Client} The singleton instance of the Client class.
   */
  public static getInstance(): Client {
    if (!this.instance) {
      try {
        this.instance = new Client({
          endPoint: STORAGE_URL,
          port: Number(STORAGE_PORT),
          useSSL: true,
          accessKey: STORAGE_ACCESS_KEY,
          secretKey: STORAGE_SECRET_KEY,
        });

        if (ENVIRONMENT !== "production") {
          this.instance.setRequestOptions({
            rejectUnauthorized: false
          })
        }
      } catch (error) {
        console.error("Failed to connect to MinIO:", error);
      }
    }
    return this.instance;
  }
}

export const storage = Storage.getInstance();