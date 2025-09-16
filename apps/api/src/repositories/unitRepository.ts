import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { units, unitUsers } from "../db/schema/units";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { units, unitUsers } });

// -------------------------
// Units CRUD
// -------------------------

export async function createUnit(tenantId: string, name: string) {
  const [newUnit] = await db
    .insert(units)
    .values({ tenantId, name })
    .returning();
  return newUnit;
}

export async function updateUnit(unitId: number, data: { name?: string }) {
  const [updated] = await db
    .update(units)
    .set({
      ...(data.name ? { name: data.name } : {}),
      updatedAt: new Date(),
    })
    .where(eq(units.id, unitId))
    .returning();
  return updated;
}

export async function getUnitsByTenant(tenantId: string) {
  return db.select().from(units).where(eq(units.tenantId, tenantId));
}

export async function getUnitById(unitId: number) {
  return db.select().from(units).where(eq(units.id, unitId));
}

export async function deleteUnit(unitId: number) {
  return db.delete(units).where(eq(units.id, unitId));
}

// -------------------------
// Team / Users in Units
// -------------------------

export async function addUserToUnit(unitId: number, userId: string) {
  const [record] = await db
    .insert(unitUsers)
    .values({ unitId, userId })
    .returning();
  return record;
}

export async function removeUserFromUnit(unitId: number, userId: string) {
  return db
    .delete(unitUsers)
    .where(and(eq(unitUsers.unitId, unitId), eq(unitUsers.userId, userId)));
}

export async function getUsersInUnit(unitId: number) {
  return db.select().from(unitUsers).where(eq(unitUsers.unitId, unitId));
}
