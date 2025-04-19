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

    private constructor() { }
    /**
     * Returns a singleton instance of the Redis class.
     * @returns {Redis} The singleton instance of the Redis class.
     */
    public static getInstance(): Redis {
        if (!this.instance) {
            try {
                this.instance = new Redis(KV_URL);
            } catch (error) {
                console.error("Failed to connect to Redis:", error);
            }
        }
        return this.instance;
    }
}

export const kv = KV.getInstance();