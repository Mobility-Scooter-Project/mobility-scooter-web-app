import { DATABASE_URL } from "@config/constants";
import { HTTP_CODES } from "@src/config/http-codes";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Context, Next } from "hono";
import * as auth from "@src/db/schema/auth";
import * as videos from "@src/db/schema/storage";
import * as tenants from "@src/db/schema/tenants";
import { HTTPError } from "@src/lib/errors";
import { pool } from "@src/services/db";


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
    schema: { ...auth, ...videos, ...tenants },
  });

  try {
    if (userId) {
      await db.transaction(async (tx) => {
        tx.execute(sql`SET ROLE authenticated_user`);
        tx.execute(sql`SET app.user_id = ${userId}`);
      });
    } else {
      await db.execute(sql`SET ROLE anonymous_user`);
    }
  } catch (e) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      e,
      "Failed to set user context",
    );
  }

  c.set("db", db);

  await next();
};

// For Postgres Role
export const postgresDB = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...auth, ...videos, ...tenants },
});

export type DB = typeof postgresDB;
