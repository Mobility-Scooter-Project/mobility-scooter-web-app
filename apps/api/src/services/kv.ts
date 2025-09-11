import { KV_URL } from "@src/config/constants";
import { injectable } from "inversify";
import { Redis } from "ioredis";


@injectable()
export class KVService {
    public static async build(): Promise<Redis> {
        const redis = new Redis(KV_URL, { lazyConnect: true });
        return redis;
    }
}