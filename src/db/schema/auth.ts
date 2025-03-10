import { boolean, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auth = pgSchema("auth");

export const apiKeys = auth.table("api_keys", {
  id: uuid().primaryKey().notNull(),
  encryptedKey: text().notNull(),
  owner: text().notNull(),
  // scopes: jsonb().notNull(),
  isActive: boolean().default(true),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const users = auth.table("users", {});
