import { KV_URL } from "@src/config/constants";
import { injectable } from "inversify";
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
@injectable()
export class KVService {
    public static async build(): Promise<Redis> {
        const redis = new Promise<Redis>((resolve, reject) => {
            try {
                const redis = new Redis(KV_URL);
                redis.on("error", (err) => {
                    console.error("Redis connection error:", err);
                    reject(err);
                });
                redis.on("connect", () => {
                    console.log("Connected to Redis");
                    resolve(redis);
                });
            } catch (error) {
                console.error("Failed to create Redis connection:", error);
                reject(error);
            }
        });

        return await redis;
    }
}