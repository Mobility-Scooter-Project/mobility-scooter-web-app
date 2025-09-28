import { postgresDB, type DB } from "@src/middleware/db";
import { unitRepository } from "@src/repositories/tenants/unit";
import { signJWT } from "@src/lib/jwt";
import { verify as verifyJwt } from "hono/jwt";
import { JWT_SECRET } from "@config/constants";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";
import { users as usersTable } from "@src/db/schema/auth";
import { units as unitsTable } from "@src/db/schema/tenants";

type Unit = typeof unitsTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type UnitId = Unit['id'];
type UserId = User['id'];
type UserFields = keyof User;

interface InviteTokenPayload {
  tenantId: string;
  unitId: UnitId;
  exp: number;
  [key: string]: unknown;
}

/**
 * UnitService - business logic for units and invites
 */
export class UnitService {
  private db: DB;

  constructor(db?: DB) {
    this.db = db ?? postgresDB;
  }

  /**
   * Create a new unit under a tenant
   */
  async createUnit(tenantId: UnitId, adminUserId?: UserId | null) {
    try {
      return await unitRepository.createUnit(this.db, { tenantId, adminUserId });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create unit");
    }
  }

  /**
   * Update a unit (e.g., set/change admin)
   */
  async updateUnit(unitId: UnitId, updates: Partial<{ adminUserId: UserId | null }>) {
    try {
      return await unitRepository.updateUnit(this.db, unitId, updates);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to update unit");
    }
  }

  /**
   * Manually add a user to a unit
   */
  async addUser(userId: UserId, unitId: UnitId) {
    try {
      return await unitRepository.addUserToUnit(this.db, userId, unitId);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to add user to unit");
    }
  }

  /**
   * Remove a user from a unit
   */
  async removeUser(userId: UserId, defaultUnitId: UnitId): Promise<boolean> {
    try {
      const result = await unitRepository.removeUserFromUnit(this.db, userId, defaultUnitId);
      if (!result) {
        throw new HTTPError(HTTP_CODES.NOT_FOUND, null, "User not found in unit");
      }
      return true;
    } catch (e) {
      if (e instanceof HTTPError) throw e;
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to remove user from unit");
    }
  }

  /**
   * Create invite token (JWT) that contains { tenantId, unitId } and expires in 7 days
   */
  async createInviteToken(tenantId: UnitId, unitId: UnitId, params: Record<string, unknown> = {}) {
    try {
      const payload = {
        tenantId,
        unitId,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        ...params, // Allow exp to be overridden
      } satisfies InviteTokenPayload;
      return await signJWT(payload);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create invite token");
    }
  }

  /**
   * Accept invite: verify token and attach the user (userId) to unit described in token
   */
  async acceptInvite(token: string, userId: UserId) {
    try {
      // Verify the token signature and expiry
      let payload: InviteTokenPayload;
      try {
        payload = await verifyJwt(token, JWT_SECRET) as InviteTokenPayload;
      } catch (error) {
        // Handle expired token case first
        if (error instanceof Error && (error.name === "JWTExpired" || error.message.toLowerCase().includes("expired"))) {
          throw new HTTPError(HTTP_CODES.UNAUTHORIZED, error, "Invite token expired");
        }
        // Then handle other JWT errors
        throw new HTTPError(HTTP_CODES.BAD_REQUEST, error, "Invalid invite token");
      }

      // Verify required payload fields
      const { tenantId, unitId } = payload;
      if (!tenantId || !unitId) {
        throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, "Invalid invite token payload");
      }

      const updatedUser = await unitRepository.addUserToUnit(this.db, userId, unitId);
      return { unitId, tenantId, user: updatedUser };
    } catch (error) {
      if (error instanceof HTTPError) throw error;
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, error, "Invalid invite token");
    }
  }

  /**
   * Get users that belong to a unit (with optional fields + pagination)
   */
  async getUsers(unitId: UnitId, fields?: UserFields[], limit = 50, offset = 0) {
    try {
      return await unitRepository.getUsersByUnit(this.db, unitId, { fields, limit, offset });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to fetch users for unit");
    }
  }
}

/**
 * Export singleton instance
 */
export const unitService = new UnitService();