import { units as unitsTable } from "@src/db/schema/tenants";
import { users as usersTable } from "@src/db/schema/auth";
import { postgresDB, type DB } from "@src/middleware/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";

type Unit = typeof unitsTable.$inferSelect;
type UnitInsert = typeof unitsTable.$inferInsert;
type User = typeof usersTable.$inferSelect;
type UserInsert = typeof usersTable.$inferInsert;
type UnitId = Unit['id'];
type UserId = User['id'];

/**
 * Unit repository functions
 */

/**
 * Create a new unit
 *
 * @param {DB} db - Database connection instance
 * @param {Object} payload - Data for creating a new unit
 * @param {string} payload.tenantId - ID of the tenant the unit belongs to
 * @param {string|null} [payload.adminUserId] - Optional admin user ID assigned to the unit
 *
 * @returns {Promise<{ id: string; tenantId: string; adminUserId: string | null }>}
 *   Created unit object with ID, tenantId, and adminUserId
 *
 * @throws {HTTPError} INTERNAL_SERVER_ERROR if database insert fails
 */
export const createUnit = async (
  db: DB,
  payload: UnitInsert
): Promise<Unit> => {
  try {
    const result = await db
      .insert(unitsTable)
      .values({
        tenantId: payload.tenantId,
        adminUserId: payload.adminUserId ?? null,
      })
      .returning();
    return result[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to create unit"
    );
  }
};

/**
 * Update a unit by ID
 *
 * @param {DB} db - Database connection instance
 * @param {string} unitId - ID of the unit to update
 * @param {Partial<{ adminUserId: string | null }>} updates - Fields to update on the unit
 *
 * @returns {Promise<{ id: string; tenantId: string; adminUserId: string | null }>}
 *   Updated unit object.
 *
 * @throws {HTTPError} INTERNAL_SERVER_ERROR if database update fails
 */
export const updateUnit = async (
  db: DB,
  unitId: UnitId,
  updates: Partial<UnitInsert>
): Promise<Unit> => {
  try {
    const result = await db
      .update(unitsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unitsTable.id, unitId))
      .returning();
    return result[0];
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to update unit"
    );
  }
};

/**
 * Get users that belong to a unit, with optional fields and pagination
 *
 * @param {DB} db - Database connection instance
 * @param {string} unitId - ID of the unit whose users to fetch
 * @param {Object} options - Query options
 * @param {string[]} [options.fields=["id","email","firstName","lastName"]] - Fields to include in the response
 * @param {number} [options.limit=50] - Max number of users to return
 * @param {number} [options.offset=0] - Pagination offset
 *
 * @returns {Promise<Partial<User>[]>}
 *   Array of user objects with only the requested fields
 *
 * @throws {HTTPError} INTERNAL_SERVER_ERROR if query fails
 */
export const getUsersByUnit = async (
  db: DB,
  unitId: string,
  {
    fields = ["id", "email", "firstName", "lastName"],
    limit = 50,
    offset = 0,
  }: { fields?: Array<keyof User>; limit?: number; offset?: number }
): Promise<Partial<User>[]> => {
  try {
    const selectFields = fields.reduce((acc, field) => {
        return { ...acc, [field]: usersTable[field] };
      }, {});

    const rows = await db
      .select(selectFields)
      .from(usersTable)
      .where(
        and(
          eq(usersTable.unitId, unitId),
          isNull(usersTable.deletedAt)
        )
      )
      .limit(limit)
      .offset(offset);

    return rows;
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to fetch users for unit"
    );
  }
};

/**
 * Remove a user from a unit by setting `unitId = null`
 *
 * @param {DB} db - Database connection instance
 * @param {string} userId - ID of the user to remove
 *
 * @returns {Promise<boolean>} True if successful
 *
 * @throws {HTTPError} INTERNAL_SERVER_ERROR if update fails
 */
export const removeUserFromUnit = async (db: DB, userId: UserId, defaultUnitId: UnitId): Promise<User | null> => {
  try {
    // First check if user exists and has a unit assigned that's not the default unit
    const user = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, userId),
          isNull(usersTable.deletedAt),
          ne(usersTable.unitId, defaultUnitId) // Must not already be in default unit
        )
      )
      .limit(1);

    if (!user.length) {
      // User either doesn't exist, is already in default unit, or has no unit assigned
      return null;
    }

    // Then update the user's unit to default
    const result = await db
      .update(usersTable)
      .set({ unitId: defaultUnitId, updatedAt: new Date() })
      .where(
        and(
          eq(usersTable.id, userId),
          isNull(usersTable.deletedAt),
          eq(usersTable.unitId, user[0].unitId) // Only update if unit matches what we found
        )
      )
      .returning();

    return result[0] ?? null;
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to remove user from unit"
    );
  }
};

/**
 * Attach (add) a user to a unit by setting their `unitId`
 *
 * @param {DB} db - Database connection instance
 * @param {string} userId - ID of the user to add
 * @param {string} unitId - ID of the unit to assign the user to
 *
 * @returns {Promise<Partial<typeof usersTable.$inferSelect> | null>}
 *   Updated user object if successful, null if no record found
 *
 * @throws {HTTPError} INTERNAL_SERVER_ERROR if update fails
 */
export const addUserToUnit = async (
  db: DB,
  userId: UserId,
  unitId: UnitId
): Promise<User> => {
  try {
    const updated = await db
      .update(usersTable)
      .set({ unitId, updatedAt: new Date() })
      .where(
        and(
          eq(usersTable.id, userId),
          isNull(usersTable.deletedAt)
        )
      )
      .returning();
    return updated[0] ?? null;
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to add user to unit"
    );
  }
};

export const unitRepository = {
  createUnit,
  updateUnit,
  getUsersByUnit,
  removeUserFromUnit,
  addUserToUnit,
};