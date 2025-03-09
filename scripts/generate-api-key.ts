import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { apiKeys } from "../src/db/schema/auth";
import os from "node:os";

const hostname = os.hostname();

try {
  const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await db.insert(apiKeys).values({
    id: sql`gen_random_uuid()`,
    owner: hostname,
    encryptedKey: sql.raw(`crypt('${key}', gen_salt('bf'))`),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Successfully generate API key ${key} for device: ${hostname}`);
} catch (e) {
  console.error(e);
}

process.exit(0);