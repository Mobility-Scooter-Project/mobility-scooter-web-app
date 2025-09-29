import { Hono } from 'hono';
import type { Variables } from 'src';
import { unitService } from '@src/services/unit';
import { HTTPError } from '@src/lib/errors';
import { HTTP_CODES } from '@src/config/http-codes';
import {
  unitCreateRateLimiter,
  unitUpdateRateLimiter,
  unitInviteRateLimiter,
  unitUserManageRateLimiter,
  unitListRateLimiter,
  unitDeleteRateLimiter,
} from '@src/middleware/rate-limit';
import { users as usersTable } from '@src/db/schema/auth';
import { units as unitsTable } from '@src/db/schema/tenants';

type Unit = typeof unitsTable.$inferSelect;
type User = typeof usersTable.$inferSelect;
type UserId = User['id'];
type UserFields = keyof User;

// Define allowed user fields explicitly for field validation
// Excludes sensitive fields like encryptedPassword
const allowedUserFields: UserFields[] = [
  'id',
  'unitId',
  'email',
  'firstName',
  'lastName',
  'permissions',
  'lastSignedInAt',
  'createdAt',
  'updatedAt',
] as const;

type CreateUnitBody = {
  adminUserId?: UserId | null;
};

type UpdateUnitBody = {
  adminUserId?: UserId | null;
};

type AcceptInviteBody = {
  userId: UserId;
};

const app = new Hono<{ Variables: Variables }>();

// Apply specific rate limits based on operation type
app.post('/tenant/:tenantId/units', unitCreateRateLimiter);
app.put('/tenant/:tenantId/unit/:unitId', unitUpdateRateLimiter);
app.delete('/tenant/:tenantId/unit/:unitId', unitDeleteRateLimiter);
app.post('/tenant/:tenantId/unit/:unitId/invite', unitInviteRateLimiter);
app.post('/unit/invite/accept', unitInviteRateLimiter);
app.get('/tenant/:tenantId/unit/:unitId/users', unitListRateLimiter);
app.delete(
  '/tenant/:tenantId/unit/:unitId/users/:userId',
  unitUserManageRateLimiter,
);

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
app.post('/tenant/:tenantId/units', async (c) => {
  const { tenantId } = c.req.param();
  const body = await c.req.json().catch<Partial<CreateUnitBody>>(() => ({}));
  try {
    const adminUserId = body.adminUserId ?? null;
    const unit = await unitService.createUnit(tenantId, adminUserId);
    return c.json(unit, 201);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to create unit',
    );
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
app.put('/tenant/:tenantId/unit/:unitId', async (c) => {
  const { unitId } = c.req.param();
  const body = await c.req.json().catch<Partial<UpdateUnitBody>>(() => ({}));
  try {
    const updated = await unitService.updateUnit(unitId, body);
    return c.json(updated, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to update unit',
    );
  }
});

/**
 * DELETE /tenant/{tenantId}/unit/{unitId}
 *
 * Delete a unit (soft delete)
 *
 * @param {string} tenantId - Tenant identifier (path param)
 * @param {string} unitId - Unit identifier (path param)
 *
 * @returns {204 | 400 | 404 | 500} Empty response on success or error
 *
 * @remarks
 * This is a soft delete operation that sets the deletedAt timestamp.
 * Units with active users cannot be deleted - remove users first.
 */
app.delete('/tenant/:tenantId/unit/:unitId', async (c) => {
  const { tenantId, unitId } = c.req.param();
  try {
    await unitService.deleteUnit(unitId, tenantId);
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to delete unit',
    );
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
app.post('/tenant/:tenantId/unit/:unitId/invite', async (c) => {
  const { tenantId, unitId } = c.req.param();
  try {
    const token = await unitService.createInviteToken(tenantId, unitId);
    return c.json({ token }, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to create invitation',
    );
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
app.post('/unit/invite/accept', async (c) => {
  const token = (c.req.query('token') ?? '') as string;
  const body = await c.req.json().catch<Partial<AcceptInviteBody>>(() => ({}));
  const userId = body.userId;

  if (!token) {
    throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, 'Missing token');
  }
  if (!userId) {
    throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, 'Missing userId in body');
  }
  try {
    const result = await unitService.acceptInvite(token, userId);
    return c.json(result, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to accept invite',
    );
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
app.get('/tenant/:tenantId/unit/:unitId/users', async (c) => {
  const { unitId } = c.req.param();
  const fieldsQS = c.req.query('fields') || '';
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  // Validate fields against allowed user table columns
  const fields = fieldsQS
    ? fieldsQS
        .split(',')
        .map((s) => s.trim())
        .filter((f): f is UserFields =>
          allowedUserFields.includes(f as UserFields),
        )
    : undefined;
  try {
    const users = await unitService.getUsers(unitId, fields, limit, offset);
    return c.json({ users }, 200);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to list users for unit',
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
app.delete('/tenant/:tenantId/unit/:unitId/users/:userId', async (c) => {
  const { userId, unitId } = c.req.param();
  try {
    // Remove the user from the specified unit (unitId is the unit they're being removed FROM)
    // If a not-null constraint exists, ensure the user is assigned to a default or fallback unit as needed
    await unitService.removeUser(userId, unitId);
    return c.body(null, 204);
  } catch (e) {
    if (e instanceof HTTPError) throw e;
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      'Failed to remove user from unit',
    );
  }
});

export default app;
