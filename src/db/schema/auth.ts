import {
  boolean,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { units } from "./tenants";

export const auth = pgSchema("auth");

export const apiKeys = auth.table("api_keys", {
  id: uuid().primaryKey().notNull(),
  encryptedKey: text().notNull(),
  owner: text().notNull(),
  // scopes: jsonb().notNull(),
  isActive: boolean().default(true),
  lastUsedAt: timestamp(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const users = auth.table("users", {
  id: uuid().primaryKey().defaultRandom(),
  unitId: uuid()
    .references(() => units.id)
    .notNull(),
  email: text().notNull().unique(),
  encryptedPassword: text(),
  permissions: jsonb().default({}),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  lastSignedInAt: timestamp(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const providers = auth.enum("providers", ["emailpass"]);

export const identities = auth.table("identities", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  provider: providers().notNull(),
  metadata: jsonb().default({}),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
});

export const sessions = auth.table("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  refreshed_at: timestamp().defaultNow(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const refreshTokens = auth.table("refresh_tokens", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  sessionId: uuid()
    .references(() => sessions.id)
    .notNull(),
  token: text().notNull(),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});
