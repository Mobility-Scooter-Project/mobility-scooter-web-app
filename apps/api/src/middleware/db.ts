import { DATABASE_URL } from "@config/constants";
import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Next } from "hono";
import * as auth from "../db/schema/auth";
import * as videos from "../db/schema/videos";
import * as tenants from "../db/schema/tenants";
import pg from "pg";
import { sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Middleware for handling database connections and user context in the application.
 * Sets up a Drizzle database instance with authentication and video schemas,
 * and establishes user context if a userId is present.
 *
 * @param c - The Context object containing request/response information
 * @param next - The Next function to pass control to the next middleware
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * app.use(dbMiddleware);
 * ```
 */
export const dbMiddleware = async (c: Context, next: Next) => {
  const userId = c.get("userId");

  const db = drizzle({
    client: pool,
    casing: "snake_case",
    schema: { ...auth, ...videos },
  });

  try{
  if (userId) {
    await db.transaction(async (tx) => {
      tx.execute(sql`SET ROLE authenticated_user`);
      tx.execute(sql`SET app.user_id = ${userId}`);
    })
  } else {
    await db.execute(sql`SET ROLE anonymous_user`);
  }
} catch (e) {
  console.error(`Failed to set user context: ${e}`);
  throw new HTTPException(500, { res: new Response(JSON.stringify({ data: null, error: "Failed to set user context" })) });
}

  c.set("db", db);

  await next();
};

// For Postgres Role
export const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...auth, ...videos, ...tenants },
});

export type DB = typeof db;
