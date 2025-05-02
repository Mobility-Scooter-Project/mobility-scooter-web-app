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
    public static instance: Redis;
    private static connectionPromise: Promise<boolean>;

    public constructor() {
        if (!KV.instance) {
            KV.connectionPromise = new Promise((resolve) => {
                try {
                    KV.instance = new Redis(KV_URL);
                    resolve(true);
                } catch (error) {
                    resolve(false);
                }
            });
        }
        return KV.instance;
    }

    /**
     * Checks the connection status of the Redis instance.
     * @returns {Promise<boolean>} A promise that resolves to true if connected, false otherwise.
     */
    public static async getConnectionStatus(): Promise<boolean> {
        if (!KV.instance) {
            return false;
        }
        return await KV.connectionPromise;
    }
}

export const kv = new KV();