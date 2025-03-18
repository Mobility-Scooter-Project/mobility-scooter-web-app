import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const tenants = pgSchema('tenants')

export const metadata = tenants.table('metadata', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})

export const units = tenants.table('units', {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid()
    .references(() => metadata.id)
    .notNull(),
  adminUserId: uuid(), // cannot use a circular reference here
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
  deletedAt: timestamp(),
})
