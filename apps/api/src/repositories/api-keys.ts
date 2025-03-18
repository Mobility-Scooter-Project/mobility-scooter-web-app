import { apiKeys } from "@src/db/schema/auth";
import { db } from "@src/middleware/db";
import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const bumpLastUsed = async (apiKey: string) => {
    const lastUsedAt = new Date();

    try {
        await db.update(apiKeys).set({ lastUsedAt }).where(eq(apiKeys.encryptedKey, sql`crypt(${apiKey}, ${apiKeys.encryptedKey})`));
    } catch (e) {
        console.error(e);
        throw new HTTPException(500, { res: new Response(JSON.stringify({ message: "Failed to update last used timestamp" })) });
    }
};

export const apiKeyRepository = {
    bumpLastUsed,
};