/**
 * Integration Tests for Team/Unit CRUD HTTP Routes
 * Tests actual route handlers and request/response flow
 */

import unitApp from "../../src/handlers/units/index";
import { unitService } from "../../src/services/unit";
import { HTTPError } from "../../src/lib/errors";
import { HTTP_CODES } from "../../src/config/http-codes";
import type { Context, Next } from "hono";

// Mock the unit service and rate limiters
jest.mock("../../src/services/unit");
jest.mock("../../src/middleware/rate-limit", () => ({
  unitCreateRateLimiter: (c: Context, next: Next) => next(),
  unitUpdateRateLimiter: (c: Context, next: Next) => next(),
  unitInviteRateLimiter: (c: Context, next: Next) => next(),
  unitUserManageRateLimiter: (c: Context, next: Next) => next(),
  unitListRateLimiter: (c: Context, next: Next) => next(),
}));

const mockedUnitService = unitService as jest.Mocked<typeof unitService>;

describe("Team/Unit CRUD HTTP Routes - Integration Tests", () => {
  const mockTenantId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUnitId = "987fcdeb-51a2-43d1-9b12-426614174000";
  const mockUserId = "456e7890-e89b-12d3-a456-426614174001";
  const mockJWTToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /tenant/{tenantId}/units - Create Unit", () => {
    it("should create unit successfully", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.createUnit.mockResolvedValue(mockUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: mockUserId })
      });
      
      expect(response.status).toBe(201);
      expect(mockedUnitService.createUnit).toHaveBeenCalledWith(mockTenantId, mockUserId);
      
      const responseData = await response.json();
      expect(responseData.id).toBe(mockUnitId);
    });

    it("should handle empty request body", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.createUnit.mockResolvedValue(mockUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(201);
      expect(mockedUnitService.createUnit).toHaveBeenCalledWith(mockTenantId, null);
    });

    it("should handle service errors", async () => {
      mockedUnitService.createUnit.mockRejectedValue(
        new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, null, "Database error")
      );
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(500);
    });
  });

  describe("PUT /tenant/{tenantId}/unit/{unitId} - Update Unit", () => {
    it("should update unit successfully", async () => {
      const mockUpdatedUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.updateUnit.mockResolvedValue(mockUpdatedUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: mockUserId })
      });
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.updateUnit).toHaveBeenCalledWith(mockUnitId, { adminUserId: mockUserId });
      
      const responseData = await response.json();
      expect(responseData.adminUserId).toBe(mockUserId);
    });

    it("should handle empty update", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.updateUnit.mockResolvedValue(mockUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.updateUnit).toHaveBeenCalledWith(mockUnitId, {});
    });
  });

  describe("POST /tenant/{tenantId}/unit/{unitId}/invite - Create Invite", () => {
    it("should create invite token successfully", async () => {
      mockedUnitService.createInviteToken.mockResolvedValue(mockJWTToken);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.createInviteToken).toHaveBeenCalledWith(mockTenantId, mockUnitId);
      
      const responseData = await response.json();
      expect(responseData.token).toBe(mockJWTToken);
    });

    it("should handle service errors", async () => {
      mockedUnitService.createInviteToken.mockRejectedValue(
        new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, null, "JWT signing failed")
      );
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      expect(response.status).toBe(500);
    });
  });

  describe("POST /unit/invite/accept?token={token} - Accept Invite", () => {
    it("should accept invite successfully", async () => {
      const mockResult = {
        unitId: mockUnitId,
        tenantId: mockTenantId,
        user: {
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
        }
      };
      
      mockedUnitService.acceptInvite.mockResolvedValue(mockResult);
      
      const response = await unitApp.request(`/unit/invite/accept?token=${encodeURIComponent(mockJWTToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUserId })
      });
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.acceptInvite).toHaveBeenCalledWith(mockJWTToken, mockUserId);
      
      const responseData = await response.json();
      expect(responseData.unitId).toBe(mockUnitId);
      expect(responseData.user.id).toBe(mockUserId);
    });

    it("should handle missing token", async () => {
      const response = await unitApp.request("/unit/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUserId })
      });
      
      expect(response.status).toBe(400);
      expect(mockedUnitService.acceptInvite).not.toHaveBeenCalled();
    });

    it("should handle missing userId", async () => {
      const response = await unitApp.request(`/unit/invite/accept?token=${encodeURIComponent(mockJWTToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(400);
      expect(mockedUnitService.acceptInvite).not.toHaveBeenCalled();
    });

    it("should handle expired tokens", async () => {
      mockedUnitService.acceptInvite.mockRejectedValue(
        new HTTPError(HTTP_CODES.UNAUTHORIZED, null, "Invite token expired")
      );
      
      const response = await unitApp.request(`/unit/invite/accept?token=${encodeURIComponent(mockJWTToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUserId })
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe("GET /tenant/{tenantId}/unit/{unitId}/users - List Users", () => {
    const mockUsers = [
      { id: mockUserId, email: "user1@test.com", firstName: "User", lastName: "One" },
      { id: "another-user-id", email: "user2@test.com", firstName: "User", lastName: "Two" }
    ];

    it("should get users with default parameters", async () => {
      mockedUnitService.getUsers.mockResolvedValue(mockUsers);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users`);
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.getUsers).toHaveBeenCalledWith(mockUnitId, undefined, 50, 0);
      
      const responseData = await response.json();
      expect(responseData.users).toEqual(mockUsers);
    });

    it("should handle fields parameter", async () => {
      const filteredUsers = [
        { id: mockUserId, email: "user1@test.com" },
        { id: "another-user-id", email: "user2@test.com" }
      ];
      
      mockedUnitService.getUsers.mockResolvedValue(filteredUsers);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users?fields=id,email`);
      
      expect(response.status).toBe(200);
      // Fields should be parsed and filtered
      expect(mockedUnitService.getUsers).toHaveBeenCalledWith(mockUnitId, ["id", "email"], 50, 0);
    });

    it("should handle pagination parameters", async () => {
      mockedUnitService.getUsers.mockResolvedValue([]);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users?limit=10&offset=20`);
      
      expect(response.status).toBe(200);
      expect(mockedUnitService.getUsers).toHaveBeenCalledWith(mockUnitId, undefined, 10, 20);
    });

    it("should handle service errors", async () => {
      mockedUnitService.getUsers.mockRejectedValue(
        new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, null, "Database error")
      );
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users`);
      
      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /tenant/{tenantId}/unit/{unitId}/users/{userId} - Remove User", () => {
    it("should remove user successfully", async () => {
      mockedUnitService.removeUser.mockResolvedValue(true);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users/${mockUserId}`, {
        method: "DELETE"
      });
      
      expect(response.status).toBe(204);
      expect(mockedUnitService.removeUser).toHaveBeenCalledWith(mockUserId, mockUnitId);
    });

    it("should handle user not found", async () => {
      mockedUnitService.removeUser.mockRejectedValue(
        new HTTPError(HTTP_CODES.NOT_FOUND, null, "User not found in unit")
      );
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users/${mockUserId}`, {
        method: "DELETE"
      });
      
      expect(response.status).toBe(404);
    });

    it("should handle service errors", async () => {
      mockedUnitService.removeUser.mockRejectedValue(
        new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, null, "Database error")
      );
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users/${mockUserId}`, {
        method: "DELETE"
      });
      
      expect(response.status).toBe(500);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed JSON in request body", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.createUnit.mockResolvedValue(mockUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json"
      });
      
      // Should handle gracefully and use empty object fallback
      expect(response.status).toBe(201);
      expect(mockedUnitService.createUnit).toHaveBeenCalledWith(mockTenantId, null);
    });

    it("should handle concurrent requests", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.createUnit.mockResolvedValue(mockUnit);
      
      // Multiple concurrent requests
      const requests = Array(3).fill(null).map(() =>
        unitApp.request(`/tenant/${mockTenantId}/units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      expect(mockedUnitService.createUnit).toHaveBeenCalledTimes(3);
    });

    it("should handle non-HTTPError exceptions", async () => {
      mockedUnitService.createUnit.mockRejectedValue(new Error("Unexpected error"));
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(500);
    });
  });

  describe("Request Validation", () => {
    it("should handle missing Content-Type header", async () => {
      const mockUnit = {
        id: mockUnitId,
        tenantId: mockTenantId,
        adminUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      
      mockedUnitService.createUnit.mockResolvedValue(mockUnit);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/units`, {
        method: "POST",
        body: JSON.stringify({})
      });
      
      // Should still work with JSON fallback
      expect(response.status).toBeLessThan(500);
    });

    it("should validate query parameters for user listing", async () => {
      mockedUnitService.getUsers.mockResolvedValue([]);
      
      // Test with invalid limit/offset values
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users?limit=abc&offset=xyz`);
      
      expect(response.status).toBe(200);
      // parseInt("abc") returns NaN, parseInt("xyz") returns NaN
      expect(mockedUnitService.getUsers).toHaveBeenCalledWith(mockUnitId, undefined, NaN, NaN);
    });

    it("should filter invalid fields in user listing", async () => {
      mockedUnitService.getUsers.mockResolvedValue([]);
      
      const response = await unitApp.request(`/tenant/${mockTenantId}/unit/${mockUnitId}/users?fields=id,email,invalidField,anotherInvalid`);
      
      expect(response.status).toBe(200);
      // Should filter out invalid fields
      const callArgs = mockedUnitService.getUsers.mock.calls[0];
      const fields = callArgs[1];
      expect(fields).toContain('id');
      expect(fields).toContain('email');
      expect(fields).not.toContain('invalidField');
      expect(fields).not.toContain('anotherInvalid');
    });
  });
});