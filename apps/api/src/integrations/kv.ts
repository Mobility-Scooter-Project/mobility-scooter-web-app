import { KV_URL } from "@src/config/constants";
import { Redis } from "ioredis";

export const kv = new Redis(KV_URL);
