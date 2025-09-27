import { postgresDB } from "@src/middleware/db";
import { unitService } from "@src/services/unit";
import { HTTP_CODES } from "@src/config/http-codes";
import { SHARED_DATA } from "@tests/config/constants";

describe("Unit CRUD", () => {
  let tenantId: string;
  let unitId: string;
  let userId: string;
  let defaultUnitId: string;

  beforeAll(async () => {
    tenantId = process.env.TENANT_ID!;
    defaultUnitId = process.env.TESTING_UNIT_ID!;
    userId = process.env.TEST_USER_ID!;
    
    if (!tenantId || !defaultUnitId || !userId) {
      throw new Error('Required environment variables not set. Please check .env file.');
    }

    // Clean up test data
    try {
      await unitService.removeUser(userId, defaultUnitId).catch(() => {});
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  
  afterAll(async () => {
    // Ensure user is back in default unit
    try {
      await unitService.removeUser(userId, defaultUnitId);
    } catch (e) {
      // Ignore errors since the user might already be in the default unit
      console.log('Final cleanup - User might already be in default unit');
    }
  });

  describe("Input Validation", () => {
    it("should reject invalid tenant IDs", async () => {
      const invalidTenantIds = ['', 'invalid-uuid', null, undefined];
      for (const invalidId of invalidTenantIds) {
        await expect(unitService.createUnit(invalidId as any, userId))
          .rejects
          .toThrow();
      }
    });
  });

  describe("Unit Management", () => {
    it("should create a new unit with required fields", async () => {
      const unit = await unitService.createUnit(tenantId, userId);
      expect(unit).toHaveProperty("id");
      expect(unit).toHaveProperty("tenantId", tenantId);
      expect(unit).toHaveProperty("adminUserId", userId);
      expect(unit).toHaveProperty("createdAt");
      expect(unit).toHaveProperty("updatedAt");
      expect(unit.deletedAt).toBeNull();
      unitId = unit.id;
    });

    it("should fail to create unit with invalid tenant", async () => {
      await expect(unitService.createUnit("invalid-tenant", userId))
        .rejects
        .toThrow();
    });

    it("should update a unit's admin", async () => {
      const updated = await unitService.updateUnit(unitId, { adminUserId: userId });
      expect(updated.adminUserId).toBe(userId);
      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.id).toBe(unitId);
    });

    it("should fail to update non-existent unit", async () => {
      await expect(unitService.updateUnit("non-existent", { adminUserId: userId }))
        .rejects
        .toThrow();
    });
  });

  describe("Unit Invites", () => {
    let inviteToken: string;

    it("should create an invite token with 7 day expiry", async () => {
      inviteToken = await unitService.createInviteToken(tenantId, unitId);
      expect(typeof inviteToken).toBe("string");
      
      // Verify JWT payload
      const { verify } = await import('hono/jwt');
      const { JWT_SECRET } = await import('@config/constants');
      const decoded = await verify(inviteToken, JWT_SECRET) as { exp: number, tenantId: string, unitId: string };
      expect(decoded.tenantId).toBe(tenantId);
      expect(decoded.unitId).toBe(unitId);
      const expiry = new Date(decoded.exp * 1000);
      const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(expiry.getDate()).toBe(sevenDays.getDate());
    });

    it("should accept a valid invite token", async () => {
      const result = await unitService.acceptInvite(inviteToken, userId);
      expect(result.unitId).toBe(unitId);
      expect(result.tenantId).toBe(tenantId);
      expect(result.user).toBeDefined();
      expect(result.user.unitId).toBe(unitId);
    });

    it("should reject an invalid token", async () => {
      await expect(unitService.acceptInvite("invalid-token", userId))
        .rejects
        .toThrow();
    });

    it("should reject an expired token", async () => {
      // Create token that's already expired
      const expiredToken = await unitService.createInviteToken(tenantId, unitId, {
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      });
      await expect(unitService.acceptInvite(expiredToken, userId))
        .rejects
        .toThrow(/expired/i);
    });
  });

  describe("User Management", () => {
    it("should list users in a unit with default fields", async () => {
      const users = await unitService.getUsers(unitId);
      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        expect(users[0]).toHaveProperty("id");
        expect(users[0]).toHaveProperty("email");
        expect(users[0]).toHaveProperty("firstName");
        expect(users[0]).toHaveProperty("lastName");
      }
    });

    it("should respect field filtering", async () => {
      const users = await unitService.getUsers(unitId, ["id", "email"]);
      if (users.length > 0) {
        expect(Object.keys(users[0])).toEqual(["id", "email"]);
        expect(users[0]).not.toHaveProperty("firstName");
      }
    });

    it("should handle pagination correctly", async () => {
      // Get all users
      const allUsers = await unitService.getUsers(unitId);
      
      // Test normal pagination
      const limit = 1;
      const firstPage = await unitService.getUsers(unitId, undefined, limit, 0);
      const secondPage = await unitService.getUsers(unitId, undefined, limit, limit);

      expect(firstPage.length).toBeLessThanOrEqual(limit);
      if (allUsers.length > limit) {
        expect(firstPage[0].id).not.toBe(secondPage[0].id);
      }

      // Test boundary conditions
      const zeroLimit = await unitService.getUsers(unitId, undefined, 0, 0);
      expect(zeroLimit.length).toBe(0);

      try {
        await unitService.getUsers(unitId, undefined, limit, -1);
        fail('Should throw error for negative offset');
      } catch (e) {
        expect(e).toBeDefined();
      }

      const largeOffset = await unitService.getUsers(unitId, undefined, limit, 1000);
      expect(largeOffset.length).toBe(0);

      // Test maximum limit
      const maxLimit = 100;
      const largePage = await unitService.getUsers(unitId, undefined, maxLimit + 1, 0);
      expect(largePage.length).toBeLessThanOrEqual(maxLimit);
    });

    it("should handle concurrent user operations", async () => {
      // Create multiple units
      const units = await Promise.all([
        unitService.createUnit(tenantId),
        unitService.createUnit(tenantId),
        unitService.createUnit(tenantId)
      ]);

      // User should only be in one unit at a time
      await unitService.addUser(userId, units[0].id);
      
      const usersInUnit0 = await unitService.getUsers(units[0].id);
      const usersInUnit1 = await unitService.getUsers(units[1].id);
      const usersInUnit2 = await unitService.getUsers(units[2].id);

      expect(usersInUnit0.some(u => u.id === userId)).toBe(true);
      expect(usersInUnit1.some(u => u.id === userId)).toBe(false);
      expect(usersInUnit2.some(u => u.id === userId)).toBe(false);
    });

    it("should remove a user from a unit", async () => {
      const removed = await unitService.removeUser(userId, defaultUnitId);
      expect(removed).toBe(true);

      // Verify user is now in default unit
      const users = await unitService.getUsers(unitId, ["id"]);
      expect(users.find(u => u.id === userId)).toBeUndefined();
    });

    it("should fail to remove user that's not in the unit", async () => {
      // User is already removed, should fail
      await expect(unitService.removeUser(userId, defaultUnitId))
        .rejects
        .toThrow();
    });
  });
});
