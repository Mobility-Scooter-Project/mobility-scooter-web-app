import { KV_URL } from "@src/config/constants";
import { Redis } from "ioredis";

/**
 * A singleton class that manages Redis connection.
 * Provides a centralized way to access Redis instance across the application.
 * 
 * @class KV
 * @example
 * const redis = KV.getInstance();
 * await redis.set('key', 'value');
 * 
 * @throws {Error} When Redis connection fails
 */
export class KV {
    private static instance: Redis;
    private static connectionPromise: Promise<boolean>;

    private constructor() { }
    /**
     * Returns a singleton instance of the Redis class.
     * @returns {Redis} The singleton instance of the Redis class.
     */
    public static getInstance(): Redis {
        if (!this.instance) {
            this.connectionPromise = new Promise((resolve) => {
                try {
                    this.instance = new Redis(KV_URL);
                    this.instance.on("error", (error) => {
                        resolve(false);
                    });
                    this.instance.on("connection", () => {
                        resolve(true);
                    });
                } catch (error) {
                    resolve(false);
                }
            });
        }
        return this.instance;
    }

    /**
     * Checks the connection status of the Redis instance.
     * @returns {Promise<boolean>} A promise that resolves to true if connected, false otherwise.
     */
    public static async getConnectionStatus(): Promise<boolean> {
        if (!this.instance) {
            return false;
        }
        return await this.connectionPromise;
    }
}

export const kv = KV.getInstance();