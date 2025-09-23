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
    // Get the .env file and parse it
    const dotenv = await import('dotenv');
    const path = await import('path');
    
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    
    tenantId = process.env.TENANT_ID!;
    defaultUnitId = process.env.TESTING_UNIT_ID!;
    userId = process.env.TEST_USER_ID!;
    
    if (!tenantId || !defaultUnitId || !userId) {
      throw new Error('Required test environment variables not set. Please run seed script first.');
    }
  });

  it("should create a new unit", async () => {
    const unit = await unitService.createUnit(tenantId, userId);
    expect(unit).toHaveProperty("id");
    unitId = unit.id;
  });

  it("should update a unit", async () => {
    const updated = await unitService.updateUnit(unitId, { adminUserId: userId });
    expect(updated.adminUserId).toBe(userId);
  });

  it("should create an invite token", async () => {
    const token = await unitService.createInviteToken(tenantId, unitId);
    expect(typeof token).toBe("string");
  });

  it("should accept an invite and add user to unit", async () => {
    const token = await unitService.createInviteToken(tenantId, unitId);
    const result = await unitService.acceptInvite(token, userId);
    expect(result.unitId).toBe(unitId);
    expect(result.user).toBeDefined();
  });

  it("should list users in a unit", async () => {
    const users = await unitService.getUsers(unitId, ["id", "email"], 10, 0);
    expect(Array.isArray(users)).toBe(true);
  });

  it("should remove a user from a unit", async () => {
    const removed = await unitService.removeUser(userId, defaultUnitId);
    expect(removed).toBe(true);
  });
});
