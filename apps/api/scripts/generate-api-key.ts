import { sql } from "drizzle-orm";
import { apiKeys } from "../src/db/schema/auth";
import os from "node:os";
import fs from "node:fs";
import { DATABASE_URL } from "../src/config/constants";
import { drizzle } from "drizzle-orm/node-postgres";
import * as auth from "../src/db/schema/auth";

const hostname = os.hostname();

export const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...auth },
});

export type DB = typeof db;

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
  fs.appendFileSync(".env", `\nTESTING_API_KEY=${key}\n`);

  console.log(`Successfully wrote API key to .env file for device ${hostname}`);

  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
