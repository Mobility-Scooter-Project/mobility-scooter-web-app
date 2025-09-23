import { postgresDB, type DB } from "@src/middleware/db";
import { unitRepository } from "@src/repositories/tenants/unit";
import { signJWT } from "@src/lib/jwt";
import { verify as verifyJwt } from "hono/jwt";
import { JWT_SECRET } from "@config/constants";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";

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
  async createUnit(tenantId: string, adminUserId?: string | null) {
    try {
      return await unitRepository.createUnit(this.db, { tenantId, adminUserId });
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create unit");
    }
  }

  /**
   * Update a unit (e.g., set/change admin)
   */
  async updateUnit(unitId: string, updates: Partial<{ adminUserId: string | null }>) {
    try {
      return await unitRepository.updateUnit(this.db, unitId, updates);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to update unit");
    }
  }

  /**
   * Manually add a user to a unit
   */
  async addUser(userId: string, unitId: string) {
    try {
      return await unitRepository.addUserToUnit(this.db, userId, unitId);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to add user to unit");
    }
  }

  /**
   * Remove a user from a unit
   */
  async removeUser(userId: string, defaultUnitId: string) {
    try {
      return await unitRepository.removeUserFromUnit(this.db, userId, defaultUnitId);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to remove user from unit");
    }
  }

  /**
   * Create invite token (JWT) that contains { tenantId, unitId } and expires in 7 days
   */
  async createInviteToken(tenantId: string, unitId: string, params: Record<string, any> = {}) {
    try {
      const payload = {
        tenantId,
        unitId,
        ...params,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      };
      return await signJWT(payload);
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create invite token");
    }
  }

  /**
   * Accept invite: verify token and attach the user (userId) to unit described in token
   */
  async acceptInvite(token: string, userId: string) {
    try {
      const payload = await verifyJwt(token, JWT_SECRET);
      // @ts-ignore - JWT typing is loose
      const { tenantId, unitId } = payload as any;

      if (!tenantId || !unitId) {
        throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, "Invalid invite token payload");
      }

      const updatedUser = await unitRepository.addUserToUnit(this.db, userId, unitId);
      return { unitId, tenantId, user: updatedUser };
    } catch (e: any) {
      if (e?.name === "JWTExpired" || e?.message?.toLowerCase().includes("expired")) {
        throw new HTTPError(HTTP_CODES.UNAUTHORIZED, e, "Invite token expired");
      }
      if (e instanceof HTTPError) throw e;
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, e, "Invalid invite token");
    }
  }

  /**
   * Get users that belong to a unit (with optional fields + pagination)
   */
  async getUsers(unitId: string, fields?: string[], limit = 50, offset = 0) {
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