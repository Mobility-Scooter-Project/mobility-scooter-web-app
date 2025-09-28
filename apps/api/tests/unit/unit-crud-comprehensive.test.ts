/**
 * Comprehensive Unit Tests for UnitService
 * Tests business logic and service layer functionality
 */

import { UnitService } from "../../src/services/unit";
import { unitRepository } from "../../src/repositories/tenants/unit";
import { HTTPError } from "../../src/lib/errors";
import { HTTP_CODES } from "../../src/config/http-codes";
import * as jwtLib from "../../src/lib/jwt";
import * as honoJwt from "hono/jwt";

// Mock dependencies
jest.mock("../../src/repositories/tenants/unit");
jest.mock("../../src/lib/jwt");
jest.mock("hono/jwt");

const mockedUnitRepository = unitRepository as jest.Mocked<typeof unitRepository>;
const mockedJwtLib = jwtLib as jest.Mocked<typeof jwtLib>;
const mockedHonoJwt = honoJwt as jest.Mocked<typeof honoJwt>;

describe("UnitService - Comprehensive Tests", () => {
  const mockTenantId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUnitId = "987fcdeb-51a2-43d1-9b12-426614174000";
  const mockUserId = "456e7890-e89b-12d3-a456-426614174001";
  const mockAdminUserId = "789e0123-e89b-12d3-a456-426614174002";

  // Create a mock database instance
  const mockDb = {} as any;
  let unitService: UnitService;

  beforeEach(() => {
    jest.clearAllMocks();
    unitService = new UnitService(mockDb);
  });

  describe("createUnit", () => {
    it("should create unit with admin user", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: mockAdminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockedUnitRepository.createUnit.mockResolvedValue(mockUnit);

      const result = await unitService.createUnit(mockTenantId, mockAdminUserId);

      expect(result).toEqual(mockUnit);
      expect(mockedUnitRepository.createUnit).toHaveBeenCalledWith(mockDb, { tenantId: mockTenantId, adminUserId: mockAdminUserId });
    });

    it("should create unit without admin user", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockedUnitRepository.createUnit.mockResolvedValue(mockUnit);

      const result = await unitService.createUnit(mockTenantId, null);

      expect(result).toEqual(mockUnit);
      expect(mockedUnitRepository.createUnit).toHaveBeenCalledWith(mockDb, { tenantId: mockTenantId, adminUserId: null });
    });

    it("should handle repository errors", async () => {
      mockedUnitRepository.createUnit.mockRejectedValue(new Error("Database connection failed"));

      await expect(unitService.createUnit(mockTenantId, mockAdminUserId))
        .rejects.toThrow("Database connection failed");
    });
  });

  describe("updateUnit", () => {
    it("should update unit successfully", async () => {
      const updateData = { adminUserId: mockAdminUserId };
      const mockUpdatedUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: mockAdminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockedUnitRepository.updateUnit.mockResolvedValue(mockUpdatedUnit);

      const result = await unitService.updateUnit(mockUnitId, updateData);

      expect(result).toEqual(mockUpdatedUnit);
      expect(mockedUnitRepository.updateUnit).toHaveBeenCalledWith(mockDb, mockUnitId, updateData);
    });

    it("should handle empty update data", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockedUnitRepository.updateUnit.mockResolvedValue(mockUnit);

      const result = await unitService.updateUnit(mockUnitId, {});

      expect(result).toEqual(mockUnit);
      expect(mockedUnitRepository.updateUnit).toHaveBeenCalledWith(mockDb, mockUnitId, {});
    });

    it("should handle unit not found", async () => {
      mockedUnitRepository.updateUnit.mockRejectedValue(
        new HTTPError(HTTP_CODES.NOT_FOUND, null, "Unit not found")
      );

      await expect(unitService.updateUnit(mockUnitId, { adminUserId: mockAdminUserId }))
        .rejects.toThrow(HTTPError);
    });
  });

  describe("createInviteToken", () => {
    it("should create valid invite token", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
      
      mockedJwtLib.signJWT.mockResolvedValue(mockToken);

      const result = await unitService.createInviteToken(mockTenantId, mockUnitId);

      expect(result).toBe(mockToken);
      expect(mockedJwtLib.signJWT).toHaveBeenCalledWith(
        {
          tenantId: mockTenantId,
          unitId: mockUnitId,
          exp: expect.any(Number)
        }
      );
    });

    it("should set correct expiration time", async () => {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
      const currentTime = Math.floor(Date.now() / 1000);
      
      mockedJwtLib.signJWT.mockResolvedValue(mockToken);

      await unitService.createInviteToken(mockTenantId, mockUnitId);

      const signCall = mockedJwtLib.signJWT.mock.calls[0];
      const payload = signCall[0] as any;
      
      // Token should expire in 7 days (604800 seconds)
      expect(payload.exp).toBeGreaterThanOrEqual(currentTime + 604800 - 10);
      expect(payload.exp).toBeLessThanOrEqual(currentTime + 604800 + 10);
    });

    it("should handle JWT signing errors", async () => {
      mockedJwtLib.signJWT.mockRejectedValue(new Error("JWT signing failed"));

      await expect(unitService.createInviteToken(mockTenantId, mockUnitId))
        .rejects.toThrow(HTTPError);
    });
  });

  describe("acceptInvite", () => {
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
    const mockPayload = {
      tenantId: mockTenantId,
      unitId: mockUnitId,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    it("should accept valid invite", async () => {
      const mockUser = {
        id: mockUserId,
        email: "user@test.com",
        firstName: "Test",
        lastName: "User",
        unitId: mockUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        encryptedPassword: null,
        permissions: {},
        lastSignedInAt: null
      };

      mockedHonoJwt.verify.mockResolvedValue(mockPayload);
      mockedUnitRepository.addUserToUnit.mockResolvedValue(mockUser);

      const result = await unitService.acceptInvite(mockToken, mockUserId);

      expect(result.unitId).toBe(mockUnitId);
      expect(result.tenantId).toBe(mockTenantId);
      expect(result.user).toEqual(mockUser);
      expect(mockedHonoJwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(mockedUnitRepository.addUserToUnit).toHaveBeenCalledWith(
        mockDb,
        mockUserId,
        mockUnitId
      );
    });

    it("should reject invalid token", async () => {
      mockedHonoJwt.verify.mockRejectedValue(new Error("Invalid token"));

      await expect(unitService.acceptInvite("invalid-token", mockUserId))
        .rejects.toThrow(HTTPError);
    });

    it("should reject expired token", async () => {
      const expiredError = new Error("Token expired");
      expiredError.name = "JWTExpired";
      mockedHonoJwt.verify.mockRejectedValue(expiredError);

      await expect(unitService.acceptInvite(mockToken, mockUserId))
        .rejects.toThrow(HTTPError);
    });

    it("should handle repository errors during invite acceptance", async () => {
      mockedHonoJwt.verify.mockResolvedValue(mockPayload);
      mockedUnitRepository.addUserToUnit.mockRejectedValue(
        new HTTPError(HTTP_CODES.CONFLICT, null, "User already in unit")
      );

      await expect(unitService.acceptInvite(mockToken, mockUserId))
        .rejects.toThrow(HTTPError);
    });
  });

  describe("getUsers", () => {
    const mockUsers = [
      {
        id: mockUserId,
        email: "user1@test.com",
        firstName: "User",
        lastName: "One",
        unitId: mockUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        encryptedPassword: null,
        permissions: {},
        lastSignedInAt: null
      },
      {
        id: "another-user-id",
        email: "user2@test.com",
        firstName: "User",
        lastName: "Two",
        unitId: mockUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        encryptedPassword: null,
        permissions: {},
        lastSignedInAt: null
      }
    ];

    it("should get users with default parameters", async () => {
      mockedUnitRepository.getUsersByUnit.mockResolvedValue(mockUsers);

      const result = await unitService.getUsers(mockUnitId);

      expect(result).toEqual(mockUsers);
      expect(mockedUnitRepository.getUsersByUnit).toHaveBeenCalledWith(expect.any(Object), mockUnitId, { fields: undefined, limit: 50, offset: 0 });
    });

    it("should get users with custom parameters", async () => {
      const filteredUsers = mockUsers.map(user => ({
        id: user.id,
        email: user.email
      }));

      mockedUnitRepository.getUsersByUnit.mockResolvedValue(filteredUsers);

      const result = await unitService.getUsers(mockUnitId, ["id", "email"], 10, 20);

      expect(result).toEqual(filteredUsers);
      expect(mockedUnitRepository.getUsersByUnit).toHaveBeenCalledWith(expect.any(Object), mockUnitId, { fields: ["id", "email"], limit: 10, offset: 20 });
    });

    it("should handle empty result", async () => {
      mockedUnitRepository.getUsersByUnit.mockResolvedValue([]);

      const result = await unitService.getUsers(mockUnitId);

      expect(result).toEqual([]);
    });

    it("should handle repository errors", async () => {
      mockedUnitRepository.getUsersByUnit.mockRejectedValue(new Error("Database error"));

      await expect(unitService.getUsers(mockUnitId))
        .rejects.toThrow("Database error");
    });
  });

  describe("removeUser", () => {
    it("should remove user successfully", async () => {
      const mockUser = {
        id: mockUserId,
        email: "user@test.com",
        firstName: "Test",
        lastName: "User",
        unitId: mockUnitId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        encryptedPassword: null,
        permissions: {},
        lastSignedInAt: null
      };

      mockedUnitRepository.removeUserFromUnit.mockResolvedValue(mockUser);

      const result = await unitService.removeUser(mockUserId, mockUnitId);

      expect(result).toBe(true);
      expect(mockedUnitRepository.removeUserFromUnit).toHaveBeenCalledWith(expect.any(Object), mockUserId, mockUnitId);
    });

    it("should handle user not found", async () => {
      mockedUnitRepository.removeUserFromUnit.mockResolvedValue(null);

      await expect(unitService.removeUser(mockUserId, mockUnitId))
        .rejects.toThrow(HTTPError);
    });

    it("should handle repository errors", async () => {
      mockedUnitRepository.removeUserFromUnit.mockRejectedValue(new Error("Database constraint violation"));

      await expect(unitService.removeUser(mockUserId, mockUnitId))
        .rejects.toThrow("Database constraint violation");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null tenant ID in createUnit", async () => {
      await expect(unitService.createUnit(null as any, mockAdminUserId))
        .rejects.toThrow();
    });

    it("should handle empty string unit ID in updateUnit", async () => {
      await expect(unitService.updateUnit("", { adminUserId: mockAdminUserId }))
        .rejects.toThrow();
    });

    it("should handle malformed JWT token", async () => {
      mockedHonoJwt.verify.mockRejectedValue(new Error("Malformed JWT"));

      await expect(unitService.acceptInvite("not.a.jwt", mockUserId))
        .rejects.toThrow(HTTPError);
    });

    it("should handle negative pagination values", async () => {
      mockedUnitRepository.getUsersByUnit.mockResolvedValue([]);

      await unitService.getUsers(mockUnitId, undefined, -5, -10);

      expect(mockedUnitRepository.getUsersByUnit).toHaveBeenCalledWith(expect.any(Object), mockUnitId, { fields: undefined, limit: -5, offset: -10 });
    });

    it("should handle concurrent operations", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      mockedUnitRepository.createUnit.mockResolvedValue(mockUnit);

      const promises = Array(5).fill(null).map(() =>
        unitService.createUnit(mockTenantId, null)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockedUnitRepository.createUnit).toHaveBeenCalledTimes(5);
    });
  });
});

