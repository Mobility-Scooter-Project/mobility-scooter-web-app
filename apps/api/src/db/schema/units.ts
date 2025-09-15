import { pgTable, serial, varchar, integer, timestamp, primaryKey, uuid } from "drizzle-orm/pg-core";
import { metadata } from "./tenants";
import { users } from "./auth";

// Units table
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => metadata.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Join table: users <-> units
export const unitUsers = pgTable(
  "unit_users",
  {
    unitId: integer("unit_id") // This references units.id which is serial (integer)
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    userId: uuid("user_id") // Change this to uuid to match users.id
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.unitId, t.userId] }),
  })
);