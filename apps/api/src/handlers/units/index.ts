import { Hono } from "hono";
import type { Variables } from "src";
import { unitService } from "@src/services/unit";
import { postgresDB } from "@src/middleware/db";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";

const app = new Hono<{ Variables: Variables }>();

// POST /tenant/{tenantId}/units - create a new unit
app.post("/tenant/:tenantId/units", async (c) => {
  const { tenantId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  try {
    const adminUserId = (body as any).adminUserId ?? null;
    const unit = await unitService.createUnit(tenantId, adminUserId);
    return c.json(unit, 201);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create unit");
  }
});

// PUT /tenant/{tenantId}/unit/{unitId} - update a unit
app.put("/tenant/:tenantId/unit/:unitId", async (c) => {
  const { unitId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  try {
    const updated = await unitService.updateUnit(unitId, body);
    return c.json(updated, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to update unit");
  }
});

// POST /tenant/{tenantId}/unit/{unitId}/invite - create invite JWT (mock send email)
app.post("/tenant/:tenantId/unit/:unitId/invite", async (c) => {
  const { tenantId, unitId } = c.req.param();
  try {
    const token = await unitService.createInviteToken(tenantId, unitId);
    // In production: queue an email. For now return token (mock send)
    return c.json({ token }, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create invitation");
  }
});

// POST /unit/invite/accept?token=... - accept invite and add user to unit
app.post("/unit/invite/accept", async (c) => {
  const token = (c.req.query("token") ?? "") as string;
  const body = await c.req.json().catch(() => ({}));
  // We expect frontend to send userId when user is authenticated; else handle sign-up flow separately
  const userId = (body as any).userId;
  if (!token) {
    throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, "Missing token");
  }
  if (!userId) {
    throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, "Missing userId in body");
  }
  try {
    const result = await unitService.acceptInvite(token, userId);
    return c.json(result, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to accept invite");
  }
});

// GET /tenant/{tenantId}/unit/{unitId}/users?fields=...&limit=...&offset=...
app.get("/tenant/:tenantId/unit/:unitId/users", async (c) => {
  const { unitId } = c.req.param();
  const fieldsQS = c.req.query("fields") || "";
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);
  const fields = fieldsQS ? fieldsQS.split(",").map((s) => s.trim()) : undefined;
  try {
    const users = await unitService.getUsers(unitId, fields, limit, offset);
    return c.json({ users }, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to list users for unit");
  }
});

// DELETE /tenant/{tenantId}/unit/{unitId}/users/{userId} - remove user from team
app.delete("/tenant/:tenantId/unit/:unitId/users/:userId", async (c) => {
  const { userId } = c.req.param();
  try {
    await unitService.removeUser(userId);
    return new Response("", { status: 204 });
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to remove user from unit");
  }
});

export default app;
