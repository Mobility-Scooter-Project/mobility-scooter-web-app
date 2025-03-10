import {
  boolean,
  jsonb,
  pgPolicy,
  pgRole,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { units } from "./tenants";
import { sql } from "drizzle-orm";

export const auth = pgSchema("auth");

export const user = pgRole("authenticated_user");
export const anon = pgRole("anonymous_user");

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
}, (t) => [pgPolicy('allow unauthenticated users to create an account', 
  {
    as: "permissive",
    to: anon,
    for: "insert",
    using: sql``,
  }
)]);

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
