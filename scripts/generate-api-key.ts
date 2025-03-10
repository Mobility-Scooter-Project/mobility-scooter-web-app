import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { apiKeys } from "../src/db/schema/auth";
import os from "node:os";
import fs from "node:fs";

const hostname = os.hostname();

try {
  const key =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 8);

  await db.insert(apiKeys).values({
    id: sql`gen_random_uuid()`,
    owner: hostname,
    encryptedKey: sql.raw(`crypt('${key}', gen_salt('bf'))`),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // write to .env file
  fs.appendFileSync(
    ".env",
    `\nTESTING_API_KEY=${key}\n`
  );

  console.log(`Successfully wrote API key to .env file for device ${hostname}`);

  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
