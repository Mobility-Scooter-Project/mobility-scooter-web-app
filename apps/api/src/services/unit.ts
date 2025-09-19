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

  async createUnit(tenantId: string, adminUserId?: string | null) {
    return unitRepository.createUnit(this.db, { tenantId, adminUserId });
  }

  async updateUnit(unitId: string, updates: Partial<{ adminUserId: string | null }>) {
    return unitRepository.updateUnit(this.db, unitId, updates);
  }

  /**
   * Create invite token (JWT) that contains { tenantId, unitId } and expires in 7 days.
   * Return an object that in production would be used to send an email, here we return the token.
   */
  async createInviteToken(tenantId: string, unitId: string) {
    try {
      const payload = {
        tenantId,
        unitId,
        // issued at/time could be added automatically by sign
      };
      // signJWT returns promise<string>
      // include exp in seconds: 7 days => 7*24*60*60 = 604800
      const token = await signJWT({ ...payload, exp: Math.floor(Date.now() / 1000) + 604800 });
      return token;
    } catch (e) {
      throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create invite token");
    }
  }

  /**
   * Accept invite: verify token and attach the user (userId) to unit described in token.
   * If userId is not yet created (null), the frontend will later call a sign-up flow that also
   * uses the token to complete adding the new user to the unit. For this task we expect userId to exist.
   */
  async acceptInvite(token: string, userId: string) {
    try {
      const payload = await verifyJwt(token, JWT_SECRET);
      // payload should have tenantId and unitId
      // @ts-ignore
      const { tenantId, unitId } = payload as any;
      if (!tenantId || !unitId) {
        throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, "Invalid invite token payload");
      }
      const updatedUser = await unitRepository.addUserToUnit(this.db, userId, unitId);
      return { unitId, tenantId, user: updatedUser };
    } catch (e: any) {
      // hono/jwt will throw a specific error when verifying; wrap to HTTPError
      if (e && e.name === "JWTExpired" || e?.message?.toLowerCase().includes("expired")) {
        throw new HTTPError(HTTP_CODES.UNAUTHORIZED, e, "Invite token expired");
      }
      if (e instanceof HTTPError) throw e;
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, e, "Invalid invite token");
    }
  }

  async getUsers(unitId: string, fields?: string[], limit = 50, offset = 0) {
    return unitRepository.getUsersByUnit(postgresDB, unitId, { fields, limit, offset });
  }

  async removeUser(userId: string) {
    return unitRepository.removeUserFromUnit(postgresDB, userId);
  }
}

/**
 * Export singleton-like instance (project uses DI; you can also bind this in container)
 */
export const unitService = new UnitService();
