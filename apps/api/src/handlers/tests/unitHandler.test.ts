import { createUnitHandler } from "../unitHandler";

describe("unitHandler routes (unit tests with mocked repo)", () => {
  const tenantId = "test-tenant-uuid";
  const unitId = 1;
  const userId = "test-user-uuid";

  function makeMockRepo() {
    return {
      createUnit: jest.fn().mockResolvedValue({ id: unitId, tenantId, name: "Unit A" }),
      updateUnit: jest.fn().mockResolvedValue({ id: unitId, tenantId, name: "Updated" }),
      getUnitsByTenant: jest.fn().mockResolvedValue([{ id: unitId, tenantId, name: "Unit A" }]),
      getUnitById: jest.fn().mockResolvedValue({ id: unitId, tenantId, name: "Unit A" }),
      deleteUnit: jest.fn().mockResolvedValue(undefined),
      addUserToUnit: jest.fn().mockResolvedValue({ unitId, userId }),
      removeUserFromUnit: jest.fn().mockResolvedValue(undefined),
      getUsersInUnit: jest.fn().mockResolvedValue([{ userId }]),
    } as any;
  }

  test("POST /tenant/:tenantId/units -> creates a unit", async () => {
    const repo = makeMockRepo();
    const app = createUnitHandler(repo);
    const req = new Request(`http://localhost/tenant/${tenantId}/units`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Unit A" }),
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ id: unitId, tenantId, name: "Unit A" });
    expect(repo.createUnit).toHaveBeenCalledWith(tenantId, "Unit A");
  });

  test("GET /tenant/:tenantId/units -> lists units", async () => {
    const repo = makeMockRepo();
    const app = createUnitHandler(repo);
    const req = new Request(`http://localhost/tenant/${tenantId}/units`, {
      method: "GET",
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(repo.getUnitsByTenant).toHaveBeenCalledWith(tenantId);
  });

  test("POST /tenant/:tenantId/unit/:unitId/invite -> add user", async () => {
    const repo = makeMockRepo();
    const app = createUnitHandler(repo);
    const req = new Request(`http://localhost/tenant/${tenantId}/unit/${unitId}/invite`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ unitId, userId });
    expect(repo.addUserToUnit).toHaveBeenCalledWith(unitId, userId);
  });
});
