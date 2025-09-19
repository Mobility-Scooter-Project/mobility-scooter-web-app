import { units as unitsTable } from "@src/db/schema/tenants";
import { users as usersTable } from "@src/db/schema/auth";
import { postgresDB, type DB } from "@src/middleware/db";
import { and, eq, sql } from "drizzle-orm";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";

/**
 * Unit repository functions
 */

/**
 * Create new unit
 */
export const createUnit = async (db: DB, payload: {
  tenantId: string;
  adminUserId?: string | null;
}) => {
  try {
    const result = await db.insert(unitsTable).values({
      tenantId: payload.tenantId,
      adminUserId: payload.adminUserId ?? null,
    }).returning({ id: unitsTable.id, tenantId: unitsTable.tenantId, adminUserId: unitsTable.adminUserId });
    return result[0];
  } catch (e) {
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create unit");
  }
};

/**
 * Update a unit by id
 */
export const updateUnit = async (db: DB, unitId: string, updates: Partial<{ adminUserId: string | null }>) => {
  try {
    const result = await db.update(unitsTable)
      .set({ ...updates })
      .where(eq(unitsTable.id, unitId))
      .returning({ id: unitsTable.id, tenantId: unitsTable.tenantId, adminUserId: unitsTable.adminUserId });
    return result[0];
  } catch (e) {
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to update unit");
  }
};

/**
 * Get users that belong to a unit with optional fields and pagination.
 * fields: array of column names from users table (ex ['id','email'])
 */
export const getUsersByUnit = async (db: DB, unitId: string, {
  fields = ["id", "email", "firstName", "lastName"],
  limit = 50,
  offset = 0,
}: { fields?: string[]; limit?: number; offset?: number }) => {
  try {
    // Build select list based on allowed fields
    const allowedColumns = new Set(Object.keys(usersTable));
    // but since usersTable is an object with functions, we'll select by property names
    // Drizzle strongly typed field selection is best; keep simple and return whole row then map fields server side
    const rows = await db.select().from(usersTable).where(eq(usersTable.unitId, unitId)).limit(limit).offset(offset);
    // Project fields server-side to avoid schema typing complexity here
    const projected = rows.map((r: any) => {
      const obj: any = {};
      for (const f of fields) {
        obj[f] = (r as any)[f];
      }
      return obj;
    });
    return projected;
  } catch (e) {
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to fetch users for unit");
  }
};

/**
 * Remove user from a unit (set unitId = null)
 */
export const removeUserFromUnit = async (db: DB, userId: string) => {
  try {
    await db.update(usersTable).set({ unitId: null }).where(eq(usersTable.id, userId));
    return true;
  } catch (e) {
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to remove user from unit");
  }
};

/**
 * Attach (add) user to a unit (set unitId on the user)
 */
export const addUserToUnit = async (db: DB, userId: string, unitId: string) => {
  try {
    const updated = await db.update(usersTable).set({ unitId }).where(eq(usersTable.id, userId)).returning();
    return updated?.[0] ?? null;
  } catch (e) {
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to add user to unit");
  }
};

export const unitRepository = {
  createUnit,
  updateUnit,
  getUsersByUnit,
  removeUserFromUnit,
  addUserToUnit,
};
