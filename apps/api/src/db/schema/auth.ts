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

export const authenticated = pgRole("authenticated_user");
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

export const users = auth.table(
  "users",
  {
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
  },(t) => [
    pgPolicy("allow unauthenticated users to create an account", {
      as: "permissive",
      to: anon,
      for: "insert",
      withCheck: sql`true`,
    }),
    pgPolicy("allow unauthenticated users to login", {
      as: "permissive",
      to: anon,
      for: "select",
      using: sql`true`,
    }),
    pgPolicy("allow authenticated users to read their own data", {
      as: "permissive",
      to: authenticated,
      for: "select",
      using: sql`id = current_setting('app.user_id')::uuid`,
    }),
    pgPolicy("allow authenticated users to update their own data", {
      as: "permissive",
      to: authenticated,
      for: "update",
      using: sql`id = current_setting('app.user_id')::uuid`,
    }),
  ]
);

export const providers = auth.enum("providers", ["emailpass"]);

export const identities = auth.table("identities", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  provider: providers().notNull(),
  metadata: jsonb().default({}),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
}, (t) => [
  pgPolicy("allow authenticated users to read their own identities", {
    as: "permissive",
    to: authenticated,
    for: "select",
    using: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
  pgPolicy("allow authenticated users to create their own identities", {
    as: "permissive",
    to: authenticated,
    for: "insert",
    withCheck: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
  pgPolicy("allow authenticated users to update their own identities", {
    as: "permissive",
    to: authenticated,
    for: "update",
    withCheck: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
]);

export const sessions = auth.table("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  refreshed_at: timestamp().defaultNow(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
}, (t) => [
  pgPolicy("allow authenticated users to read their own sessions", {
    as: "permissive",
    to: authenticated,
    for: "select",
    using: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
  pgPolicy("allow authenticated users to create their own sessions", {
    as: "permissive",
    to: authenticated,
    for: "insert",
    withCheck: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
  pgPolicy("allow authenticated users to update their own sessions", {
    as: "permissive",
    to: authenticated,
    for: "update",
    withCheck: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
]);

export const refreshTokens = auth.table("refresh_tokens", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: uuid()
    .references(() => sessions.id)
    .notNull(),
  token: text().notNull(),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
}, (t) => [
  pgPolicy("allow authenticated users to read their own refresh tokens", {
    as: "permissive",
    to: authenticated,
    for: "select",
    using: sql`user_id = current_setting('app.user_id')::uuid`,
  }),
  pgPolicy("allow authenticated users to create their own refresh tokens", {
    as: "permissive",
    to: authenticated,
    for: "insert",
    withCheck: sql`user_id = current_setting('app.user_id')::uuid`,
  }
  )
]);

