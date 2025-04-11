import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { DATABASE_URL } from "../src/config/constants";
import { apiKeys } from "../src/db/schema/auth";
import * as auth from "../src/db/schema/auth";
import { exit } from "node:process";

const hostname = os.hostname();

export const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...auth },
});

try {
  const key =
    "sk_" +
    randomBytes(32)
      .toString("base64")
      .replace(/[+/=]/g, "") // Make URL safe by removing non-alphanumeric chars
      .substring(0, 37); // Ensure consistent length

  await db.insert(apiKeys).values({
    id: sql`gen_random_uuid()`,
    owner: hostname,
    encryptedKey: sql.raw(`crypt('${key}', gen_salt('bf'))`),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // write to .env file
  fs.appendFileSync(".env", `TESTING_API_KEY=${key}\n`);
  fs.appendFileSync("../web/.env", `API_KEY=${key}\n`);

  console.log(`Successfully wrote API key to .env file for device ${hostname}`);
  exit(0);
} catch (e) {
  console.error(e);
  throw new Error("Failed to generate API key");
}
