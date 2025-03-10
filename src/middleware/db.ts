import { DATABASE_URL } from "@config/constants";
import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Next } from "hono";
import * as auth from "../db/schema/auth";
import * as videos from "../db/schema/videos";
import * as tenants from "../db/schema/tenants";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const dbMiddleware = async (c: Context, next: Next) => {
  const userId = c.get("userId");

  const db = drizzle({
    client: pool,
    casing: "snake_case",
    schema: { ...auth, ...videos },
  });

  if (userId) {
    await db.execute(`SET LOCAL app.user_id = ${userId}`);
  }

  c.set("db", db);

  await next();
};

// For typing only
export const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...auth, ...videos, ...tenants },
});

export type DB = typeof db;
