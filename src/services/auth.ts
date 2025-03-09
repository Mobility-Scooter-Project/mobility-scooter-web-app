import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { apiKeys } from "../db/schema/auth";

export const retrieveApiKey = async (key: string) => {
    const data = await db.select().from(apiKeys).where(sql`${apiKeys.encrypted_key} = crypt(${key}, ${apiKeys.encrypted_key})`);
    return data.length > 0;
};