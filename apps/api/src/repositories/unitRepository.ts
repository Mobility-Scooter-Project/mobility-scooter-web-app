import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";

// Import schema tables
import { units, unitUsers } from "../db/schema/units";

// ------------------------------------
// Local db client (temporary solution)
// ------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { units, unitUsers } });

// -------------------------
// Units CRUD
// -------------------------

// Create a new unit under a tenant
export async function createUnit(tenantId: string, name: string) {
  const [newUnit] = await db
    .insert(units)
    .values({
      tenantId,
      name,
    })
    .returning();

  return newUnit;
}

// Update a given unit
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

// Get all units for a tenant
export async function getUnitsByTenant(tenantId: string) {
  return await db
    .select()
    .from(units)
    .where(eq(units.tenantId, tenantId));
}

// Get a single unit by id
export async function getUnitById(unitId: number) {
  return await db
    .select()
    .from(units)
    .where(eq(units.id, unitId));
}

// Delete a unit
export async function deleteUnit(unitId: number) {
  return await db.delete(units).where(eq(units.id, unitId));
}

// -------------------------
// Team / Users in Units
// -------------------------

// Add user to a unit
export async function addUserToUnit(unitId: number, userId: string) {
  const [record] = await db
    .insert(unitUsers)
    .values({
      unitId,
      userId,
    })
    .returning();

  return record;
}

// Remove user from a unit
export async function removeUserFromUnit(unitId: number, userId: string) {
  return await db
    .delete(unitUsers)
    .where(and(eq(unitUsers.unitId, unitId), eq(unitUsers.userId, userId)));
}

// List all users in a unit
export async function getUsersInUnit(unitId: number) {
  return await db
    .select()
    .from(unitUsers)
    .where(eq(unitUsers.unitId, unitId));
}
