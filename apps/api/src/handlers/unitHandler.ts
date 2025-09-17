import { Hono } from "hono";
import * as repo from "../repositories/unitRepository";
import { Context } from "hono";

/**
 * simple in-memory rate limiter for development/testing
 * not suitable for multi-instance production
 */
type Entry = { count: number; start: number };
const rateMap = new Map<string, Entry>();

export function simpleRateLimit(limit = 20, windowMs = 60_000) {
  return async (c: Context, next: () => Promise<void>) => {
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      c.req.header("cf-connecting-ip") ||
      "unknown";

    const now = Date.now();
    const entry = rateMap.get(ip) ?? { count: 0, start: now };

    if (now - entry.start > windowMs) {
      entry.start = now;
      entry.count = 0;
    }

    entry.count += 1;
    rateMap.set(ip, entry);

    if (entry.count > limit) {
      c.status(429);
      c.header("Content-Type", "application/json");
      c.body(JSON.stringify({ message: "Too many requests" }));
      return; // stop the chain
    }

    await next();
  };
}

/**
 * create a hono app for unit routes
 * accepts an optional dependency object for easier testing
 */
export function createUnitHandler(deps = repo) {
  const app = new Hono();

  // apply rate limiter to all /tenant/:tenantId/units* routes
  const limiter = simpleRateLimit(20, 60_000);
  app.use("/tenant/:tenantId/units", limiter);

  // Create a new unit
  app.post("/tenant/:tenantId/units", async (c) => {
    const tenantId = c.req.param("tenantId");
    const body = await c.req.json<{ name: string }>();
    const unit = await deps.createUnit(tenantId, body.name);
    return c.json(unit, 201);
  });

  // Update a unit
  app.put("/tenant/:tenantId/unit/:unitId", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    const data = await c.req.json<{ name?: string }>();
    const updated = await deps.updateUnit(unitId, data);
    return c.json(updated);
  });

  // List units for a tenant
  app.get("/tenant/:tenantId/units", async (c) => {
    const tenantId = c.req.param("tenantId");
    const units = await deps.getUnitsByTenant(tenantId);
    return c.json(units);
  });

  // Get a single unit
  app.get("/tenant/:tenantId/unit/:unitId", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    const unit = await deps.getUnitById(unitId);
    return c.json(unit);
  });

  // Delete a unit
  app.delete("/tenant/:tenantId/unit/:unitId", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    await deps.deleteUnit(unitId);
    return c.json({ success: true });
  });

  // Add a user to a unit (invite)
  app.post("/tenant/:tenantId/unit/:unitId/invite", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    const body = await c.req.json<{ userId: string }>();
    const record = await deps.addUserToUnit(unitId, body.userId);
    return c.json(record, 201);
  });

  // Remove user from unit
  app.delete("/tenant/:tenantId/unit/:unitId/user/:userId", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    const userId = c.req.param("userId");
    await deps.removeUserFromUnit(unitId, userId);
    return c.json({ success: true });
  });

  // List users in a unit
  app.get("/tenant/:tenantId/unit/:unitId/users", async (c) => {
    const unitId = Number(c.req.param("unitId"));
    const users = await deps.getUsersInUnit(unitId);
    return c.json(users);
  });

  return app;
}

// Default app for runtime (uses real repository)
export const unitHandler = createUnitHandler();
