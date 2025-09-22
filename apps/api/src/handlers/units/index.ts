import { Hono } from "hono";
import type { Variables } from "src";
import { unitService } from "@src/services/unit";
import { postgresDB } from "@src/middleware/db";
import { HTTPError } from "@src/lib/errors";
import { HTTP_CODES } from "@src/config/http-codes";

const app = new Hono<{ Variables: Variables }>();

/**
 * POST /tenant/{tenantId}/units
 *
 * Create a new unit for a tenant
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {Object} body - Request body.
 * @param {string} [body.adminUserId] - Optional admin user ID to assign
 *
 * @returns {201 | 500} JSON of created unit or error
 */
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

/**
 * PUT /tenant/{tenantId}/unit/{unitId}
 *
 * Update an existing unit
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {string} unitId - Unit identifier (path param)
 * @param {Object} body - Request body containing unit fields to update
 *
 * @returns {200 | 500} JSON of updated unit or error
 */
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

/**
 * POST /tenant/{tenantId}/unit/{unitId}/invite
 *
 * Generate an invite token for a unit
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {string} unitId - Unit identifier (path param)
 *
 * @returns {200 | 500} JSON containing `{ token }` or error
 */
app.post("/tenant/:tenantId/unit/:unitId/invite", async (c) => {
  const { tenantId, unitId } = c.req.param();
  try {
    const token = await unitService.createInviteToken(tenantId, unitId);
    return c.json({ token }, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(HTTP_CODES.INTERNAL_SERVER_ERROR, e, "Failed to create invitation");
  }
});

/**
 * POST /unit/invite/accept?token=...
 *
 * Accept an invite and add a user to a unit
 *
 * @param {string} token - Invite token (query param)
 * @param {Object} body - Request body
 * @param {string} body.userId - User ID accepting the invite
 *
 * @returns {200 | 400 | 500} JSON result or error
 */
app.post("/unit/invite/accept", async (c) => {
  const token = (c.req.query("token") ?? "") as string;
  const body = await c.req.json().catch(() => ({}));
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

/**
 * GET /tenant/{tenantId}/unit/{unitId}/users
 *
 * List users in a unit with optional pagination and field filtering
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {string} unitId - Unit identifier (path param)
 * @param {string} [fields] - Comma-separated list of fields to return (query param)
 * @param {number} [limit=50] - Max users to return (query param)
 * @param {number} [offset=0] - Pagination offset (query param)
 *
 * @returns {200 | 500} JSON `{ users: [...] }` or error
 */
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
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to list users for unit"
    );
  }
});

/**
 * DELETE /tenant/{tenantId}/unit/{unitId}/users/{userId}
 *
 * Remove a user from a unit
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {string} unitId - Unit identifier (path param)
 * @param {string} userId - User identifier (path param)
 *
 * @returns {204 | 500} Empty response on success or error
 */
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